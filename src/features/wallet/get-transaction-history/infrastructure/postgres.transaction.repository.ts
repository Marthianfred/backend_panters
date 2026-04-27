import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import type { ITransactionRepository } from '../interfaces/transaction.repository.interface';
import type { TransactionData } from '../get-transaction-history.models';

interface TransactionQueryRow {
  id: string;
  type: string;
  amount: string;
  description: string;
  referenceId: string;
  createdAt: Date;
}

@Injectable()
export class PostgresTransactionRepository implements ITransactionRepository {
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.getOrThrow<string>('DATABASE_URL'),
    });
  }

  public async getTransactionsByUserId(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ transactions: TransactionData[]; total: number }> {
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        wt.id, 
        wt.type, 
        wt.amount, 
        wt.description, 
        wt.reference_id AS "referenceId", 
        wt.created_at AS "createdAt",
        COUNT(*) OVER() AS "totalCount"
      FROM wallet_transactions wt
      JOIN antigravity_wallets aw ON wt.wallet_id = aw.id
      WHERE aw.user_id = $1
      ORDER BY wt.created_at DESC
      LIMIT $2 OFFSET $3;
    `;

    const result = await this.pool.query<TransactionQueryRow & { totalCount: string }>(query, [
      userId,
      limit,
      offset,
    ]);

    const total = result.rows.length > 0 ? parseInt(result.rows[0].totalCount, 10) : 0;

    const transactions = result.rows.map((row) => ({
      id: row.id,
      type: row.type,
      amount: parseFloat(row.amount),
      description: row.description,
      referenceId: row.referenceId,
      createdAt: row.createdAt,
    }));

    return { transactions, total };
  }
}
