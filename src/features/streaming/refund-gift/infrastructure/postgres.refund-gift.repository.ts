import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { IRefundGiftRepository } from '../interfaces/refund-gift.repository.interface';
import { RefundAlreadyProcessedError } from '../refund-gift.models';

@Injectable()
export class PostgresRefundGiftRepository implements IRefundGiftRepository {
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.getOrThrow<string>('DATABASE_URL'),
    });
  }

  public async processRefundTransaction(
    transactionId: string,
    reason?: string,
  ): Promise<{ refundTransactionId: string; newBalance: number } | null> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Buscar la transacción original en gift_transactions para obtener detalles
      const checkQuery = `
        SELECT gt.user_id, gt.creator_id, gt.gift_id, gt.coins_spent, wt.id as original_wallet_id, wt.wallet_id
        FROM gift_transactions gt
        JOIN wallet_transactions wt ON wt.reference_id = gt.gift_id::text
        JOIN antigravity_wallets aw ON wt.wallet_id = aw.id AND aw.user_id = gt.user_id
        WHERE gt.gift_id::text = $1 OR wt.id::text = $1
        LIMIT 1;
      `;
      const originalRes = await client.query(checkQuery, [transactionId]);

      if (originalRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      const original = originalRes.rows[0];

      // 2. Verificar si ya existe un reembolso para esta transacción
      const refundCheckQuery = `
        SELECT id FROM wallet_transactions 
        WHERE type = 'credit' AND description LIKE $1;
      `;
      const refundCheckRes = await client.query(refundCheckQuery, [`%Reembolso de regalo: ${transactionId}%`]);
      
      if (refundCheckRes.rowCount && refundCheckRes.rowCount > 0) {
        await client.query('ROLLBACK');
        throw new RefundAlreadyProcessedError(transactionId);
      }

      const amountToRefund = parseFloat(original.coins_spent);
      const netToCreator = amountToRefund * 0.70;
      const platformCommission = amountToRefund * 0.30;

      // 3. Devolver saldo al usuario
      const updateUserWallet = `
        UPDATE antigravity_wallets
        SET panter_coin_balance = panter_coin_balance + $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $2
        RETURNING id as wallet_id, panter_coin_balance;
      `;
      const walletRes = await client.query(updateUserWallet, [amountToRefund, original.user_id]);
      const newBalance = parseFloat(walletRes.rows[0].panter_coin_balance);
      const walletId = walletRes.rows[0].wallet_id;

      // 4. Descontar de la wallet de la creadora (Revertir Split 70/30)
      const updateCreatorWallet = `
        UPDATE creator_wallets
        SET total_earned = total_earned - $1,
            net_balance = net_balance - $1,
            platform_commission = platform_commission - $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE creator_id = $3;
      `;
      await client.query(updateCreatorWallet, [netToCreator, platformCommission, original.creator_id]);

      // 5. Registrar la transacción de crédito (Reembolso)
      const logRefundQuery = `
        INSERT INTO wallet_transactions (wallet_id, type, amount, description, reference_id, created_at)
        VALUES ($1, 'credit', $2, $3, $4, CURRENT_TIMESTAMP)
        RETURNING id as transaction_id;
      `;
      const refundRes = await client.query(logRefundQuery, [
        walletId, 
        amountToRefund, 
        `Reembolso de regalo: ${transactionId}. Razón: ${reason || 'No especificada'}`,
        transactionId
      ]);

      await client.query('COMMIT');

      return {
        refundTransactionId: refundRes.rows[0].transaction_id,
        newBalance
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error en transacción de reembolso:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}
