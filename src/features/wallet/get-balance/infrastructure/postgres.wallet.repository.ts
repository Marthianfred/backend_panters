import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import {
  IWalletRepository,
  WalletData,
} from '../interfaces/wallet.repository.interface';

interface WalletQueryRow {
  userId: string;
  panterCoinBalance: string;
  lastUpdated: Date;
}

@Injectable()
export class PostgresWalletRepository implements IWalletRepository {
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.getOrThrow<string>('DATABASE_URL'),
    });
  }

  public async getWalletByUserId(userId: string): Promise<WalletData | null> {
    const query = `
      SELECT 
        user_id AS "userId", 
        panter_coin_balance AS "panterCoinBalance", 
        updated_at AS "lastUpdated"
      FROM antigravity_wallets 
      WHERE user_id = $1 AND is_active = true;
    `;

    const result = await this.pool.query<WalletQueryRow>(query, [userId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    // Retornamos el balance forzando el mapeo desde numerics de PostgreSQL si es necesario
    return {
      userId: row.userId,
      panterCoinBalance: parseFloat(row.panterCoinBalance),
      lastUpdated: row.lastUpdated,
    };
  }
}
