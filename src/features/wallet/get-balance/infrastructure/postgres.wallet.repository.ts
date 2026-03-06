import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import {
  IWalletRepository,
  WalletData,
} from '../interfaces/wallet.repository.interface';

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

    const result = await this.pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return null;
    }

    // Retornamos el balance forzando el mapeo desde numerics de PostgreSQL si es necesario
    return {
      userId: result.rows[0].userId,
      panterCoinBalance: parseFloat(result.rows[0].panterCoinBalance),
      lastUpdated: result.rows[0].lastUpdated,
    };
  }
}
