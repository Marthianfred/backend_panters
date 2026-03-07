import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { IP2PTransactionService } from '../interfaces/p2p-transaction.service.interface';

@Injectable()
export class PostgresP2PTransactionService implements IP2PTransactionService {
  private readonly logger = new Logger(PostgresP2PTransactionService.name);
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.getOrThrow<string>('DATABASE_URL'),
    });
  }

  public async executeContentPurchase(
    subscriberId: string,
    creatorId: string,
    amountInCoins: number,
  ): Promise<boolean> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Obtener billetera del suscriptor
      const subscriberWalletRes = await client.query(
        'SELECT id, panter_coin_balance FROM antigravity_wallets WHERE user_id = $1 FOR UPDATE',
        [subscriberId],
      );

      if (subscriberWalletRes.rows.length === 0) {
        throw new Error('Billetera del suscriptor no encontrada.');
      }

      const subscriberWallet = subscriberWalletRes.rows[0];
      const balance = parseFloat(subscriberWallet.panter_coin_balance);

      if (balance < amountInCoins) {
        throw new Error('Saldo insuficiente.');
      }

      // 2. Descontar del suscriptor
      await client.query(
        'UPDATE antigravity_wallets SET panter_coin_balance = panter_coin_balance - $1, updated_at = NOW() WHERE id = $2',
        [amountInCoins, subscriberWallet.id],
      );

      // 3. Registrar transacción de débito
      await client.query(
        'INSERT INTO wallet_transactions (wallet_id, type, amount, description, reference_id) VALUES ($1, $2, $3, $4, $5)',
        [
          subscriberWallet.id,
          'debit',
          amountInCoins,
          `Compra de contenido a creador: ${creatorId}`,
          `PURCHASE-${Date.now()}-${subscriberId.slice(0, 4)}`,
        ],
      );

      // 4. Repartición 70/30 para la creadora
      const creatorAmount = amountInCoins * 0.7;
      const platformCommission = amountInCoins * 0.3;

      await client.query(
        `INSERT INTO creator_wallets (creator_id, total_earned, platform_commission, net_balance, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (creator_id) DO UPDATE SET
         total_earned = creator_wallets.total_earned + EXCLUDED.total_earned,
         platform_commission = creator_wallets.platform_commission + EXCLUDED.platform_commission,
         net_balance = creator_wallets.net_balance + EXCLUDED.net_balance,
         updated_at = NOW()`,
        [creatorId, amountInCoins, platformCommission, creatorAmount],
      );

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`Error en transacción P2P: ${error.message}`);
      return false;
    } finally {
      client.release();
    }
  }
}
