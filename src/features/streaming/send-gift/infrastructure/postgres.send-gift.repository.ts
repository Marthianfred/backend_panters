import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { 
  ISendGiftRepository, 
  GiftDefinition 
} from '../interfaces/send-gift.repository.interface';

@Injectable()
export class PostgresSendGiftRepository implements ISendGiftRepository {
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.getOrThrow<string>('DATABASE_URL'),
    });
  }

  public async getGiftById(giftId: string): Promise<GiftDefinition | null> {
    const query = `
      SELECT gift_id as id, name, price_coins as "priceCoins", icon as "iconUrl"
      FROM virtual_gifts
      WHERE gift_id = $1 AND is_active = true;
    `;
    const result = await this.pool.query(query, [giftId]);
    return result.rows[0] || null;
  }

  public async userExists(userId: string): Promise<boolean> {
    const query = 'SELECT 1 FROM "user" WHERE id = $1;';
    const result = await this.pool.query(query, [userId]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  public async processGiftTransaction(
    userId: string,
    creatorId: string,
    gift: GiftDefinition,
  ): Promise<{ transactionId: string; remainingBalance: number } | null> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Verificar y Bloquear Wallet del Usuario (Deducción)
      const walletQuery = `
        UPDATE antigravity_wallets
        SET panter_coin_balance = panter_coin_balance - $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2 AND panter_coin_balance >= $1
        RETURNING id as wallet_id, panter_coin_balance;
      `;
      const walletRes = await client.query(walletQuery, [gift.priceCoins, userId]);

      if (walletRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      const walletId = walletRes.rows[0].wallet_id;
      const remainingBalance = parseFloat(walletRes.rows[0].panter_coin_balance);

      // 2. Reparto de Ganancias (Split 70/30)
      const netAmount = gift.priceCoins * 0.70;
      const platformCommission = gift.priceCoins * 0.30;

      const creatorWalletQuery = `
        INSERT INTO creator_wallets (creator_id, total_earned, net_balance, platform_commission, updated_at)
        VALUES ($1, $2, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (creator_id) DO UPDATE SET
          total_earned = creator_wallets.total_earned + EXCLUDED.total_earned,
          net_balance = creator_wallets.net_balance + EXCLUDED.net_balance,
          platform_commission = creator_wallets.platform_commission + EXCLUDED.platform_commission,
          updated_at = CURRENT_TIMESTAMP;
      `;
      await client.query(creatorWalletQuery, [creatorId, netAmount, platformCommission]);

      // 3. Registrar en Gift Transactions primero para obtener el Id único del envío
      const giftTransQuery = `
        INSERT INTO gift_transactions (user_id, creator_id, gift_id, coins_spent, created_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        RETURNING id;
      `;
      const giftTransRes = await client.query(giftTransQuery, [userId, creatorId, gift.id, gift.priceCoins]);
      const giftTransId = giftTransRes.rows[0].id;

      // 4. Registrar Transacción en Wallet (Historial Usuario) usando el Id del regalo como referencia
      const transQuery = `
        INSERT INTO wallet_transactions (wallet_id, type, amount, description, reference_id, created_at)
        VALUES ($1, 'debit', $2, $3, $4, CURRENT_TIMESTAMP)
        RETURNING id as transaction_id;
      `;
      const transRes = await client.query(transQuery, [
        walletId, 
        gift.priceCoins, 
        `Envío de regalo: ${gift.name}`, 
        giftTransId // Ahora referenciamos la transacción específica, no solo el tipo de regalo
      ]);

      await client.query('COMMIT');

      return {
        transactionId: transRes.rows[0].transaction_id,
        remainingBalance
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error en transacción de regalo:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}
