import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { IWalletRepository } from '../interfaces/wallet.repository.interface';
import { Wallet } from '../webhooks-top-up.models';

@Injectable()
export class PostgresTopUpWalletRepository implements IWalletRepository {
  private readonly logger = new Logger(PostgresTopUpWalletRepository.name);
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.getOrThrow<string>('DATABASE_URL'),
    });
  }

  public async creditCoinsToUser(
    userId: string,
    amount: number,
    referenceId: string,
  ): Promise<Wallet> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Obtener o crear billetera
      let walletRes = await client.query(
        'SELECT id, panter_coin_balance FROM antigravity_wallets WHERE user_id = $1 FOR UPDATE',
        [userId],
      );

      let walletId: string;
      let newBalance: number;

      if (walletRes.rows.length === 0) {
        const insertRes = await client.query(
          'INSERT INTO antigravity_wallets (user_id, panter_coin_balance) VALUES ($1, $2) RETURNING id',
          [userId, amount],
        );
        walletId = insertRes.rows[0].id;
        newBalance = amount;
      } else {
        const wallet = walletRes.rows[0];
        walletId = wallet.id;
        newBalance = parseFloat(wallet.panter_coin_balance) + amount;

        await client.query(
          'UPDATE antigravity_wallets SET panter_coin_balance = $1, updated_at = NOW() WHERE id = $2',
          [newBalance, walletId],
        );
      }

      // 2. Registrar transacción de crédito
      await client.query(
        `INSERT INTO wallet_transactions (wallet_id, type, amount, description, reference_id) 
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (reference_id) DO NOTHING`,
        [
          walletId,
          'credit',
          amount,
          `Recarga vía Webhook (Ref: ${referenceId})`,
          referenceId,
        ],
      );

      await client.query('COMMIT');

      return {
        walletId: walletId,
        userId: userId,
        balance: newBalance,
        lastUpdate: new Date(),
      };
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`Error acreditando monedas: ${error.message}`);
      throw error;
    } finally {
      client.release();
    }
  }
}
