import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { IEarningsRepository } from '../interfaces/earnings.repository.interface';
import {
  EarningsSummaryResponse,
  SaleTransactionDTO,
} from '../get-earnings-summary/get-earnings-summary.models';

@Injectable()
export class PostgresEarningsRepository implements IEarningsRepository {
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.getOrThrow<string>('DATABASE_URL'),
    });
  }

  public async getCreatorEarningsSummary(
    creatorId: string,
  ): Promise<EarningsSummaryResponse> {
    // 1. Obtener balance de creator_wallets
    const walletRes = await this.pool.query(
      'SELECT total_earned, platform_commission, net_balance FROM creator_wallets WHERE creator_id = $1',
      [creatorId],
    );

    const wallet = walletRes.rows[0] || {
      total_earned: '0',
      platform_commission: '0',
      net_balance: '0',
    };

    // 2. Obtener conteo total de ventas
    const salesCountRes = await this.pool.query(
      'SELECT COUNT(*) as total FROM content_purchases cp JOIN content_items ci ON cp.content_item_id = ci.id WHERE ci.creator_id = $1',
      [creatorId],
    );

    // 3. Obtener ventas recientes con detalle de comprador y contenido
    const recentSalesRes = await this.pool.query(
      `SELECT 
        cp.id,
        ci.title as content_title,
        u.name as buyer_name,
        cp.price_paid as amount,
        cp.created_at as date
       FROM content_purchases cp
       JOIN content_items ci ON cp.content_item_id = ci.id
       JOIN "user" u ON cp.user_id = u.id
       WHERE ci.creator_id = $1
       ORDER BY cp.created_at DESC
       LIMIT 10`,
      [creatorId],
    );

    const recentSales: SaleTransactionDTO[] = recentSalesRes.rows.map(
      (row) => ({
        id: row.id,
        contentTitle: row.content_title,
        buyerName: row.buyer_name,
        amount: parseFloat(row.amount),
        date: row.date,
      }),
    );

    return {
      totalEarned: parseFloat(wallet.total_earned),
      platformCommission: parseFloat(wallet.platform_commission),
      netBalance: parseFloat(wallet.net_balance),
      totalSalesCount: parseInt(salesCountRes.rows[0].total, 10),
      recentSales,
    };
  }
}
