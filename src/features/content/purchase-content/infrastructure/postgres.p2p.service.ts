import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { IP2PTransactionService } from '../interfaces/p2p-transaction.service.interface';

interface WalletRow {
  id: string;
  panter_coin_balance: string;
}

interface IdRow {
  id: string;
}

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
    contentId: string,
    amountInCoins: number,
  ): Promise<boolean> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // 0. Verificar si ya fue comprado
      const existingPurchase = await client.query<IdRow>(
        'SELECT id FROM content_purchases WHERE user_id = $1 AND content_item_id = $2',
        [subscriberId, contentId],
      );

      if (existingPurchase.rows.length > 0) {
        throw new Error('El contenido ya fue adquirido previamente.');
      }

      // 1. Obtener billetera del suscriptor
      const subscriberWalletRes = await client.query<WalletRow>(
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
      const txRef = `PURCHASE-${Date.now()}-${subscriberId.slice(0, 4)}`;
      const txResult = await client.query<IdRow>(
        'INSERT INTO wallet_transactions (wallet_id, type, amount, description, reference_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [
          subscriberWallet.id,
          'debit',
          amountInCoins,
          `Compra de contenido ID: ${contentId}`,
          txRef,
        ],
      );
      const transactionId = txResult.rows[0].id;

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

      // 5. Registrar la compra de contenido
      await client.query(
        'INSERT INTO content_purchases (user_id, content_item_id, price_paid, transaction_id) VALUES ($1, $2, $3, $4)',
        [subscriberId, contentId, amountInCoins, transactionId],
      );

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error en transacción P2P: ${message}`);
      return false;
    } finally {
      client.release();
    }
  }
}
