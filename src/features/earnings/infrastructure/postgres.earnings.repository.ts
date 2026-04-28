import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { IEarningsRepository } from '../interfaces/earnings.repository.interface';
import {
  EarningsSummaryResponse,
  SaleTransactionDTO,
} from '../get-earnings-summary/get-earnings-summary.models';
import {
  EarningsHistoryRequest,
  EarningsHistoryResponse,
  EarningTransactionDTO,
} from '../get-earnings-history/get-earnings-history.models';

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
    const walletRes = await this.pool.query(
      'SELECT total_earned, platform_commission, net_balance FROM creator_wallets WHERE creator_id = $1',
      [creatorId],
    );

    const wallet = walletRes.rows[0] || {
      total_earned: '0',
      platform_commission: '0',
      net_balance: '0',
    };

    const salesCountRes = await this.pool.query(
      'SELECT COUNT(*) as total FROM content_purchases cp JOIN content_items ci ON cp.content_item_id = ci.id WHERE ci.creator_id = $1',
      [creatorId],
    );

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

  public async getCreatorEarningsHistory(
    request: EarningsHistoryRequest,
  ): Promise<EarningsHistoryResponse> {
    const { creatorId, page = 1, limit = 10, startDate, endDate } = request;
    const offset = (page - 1) * limit;

    
    const query = `
      WITH all_earnings AS (
        -- Ventas de Contenido
        SELECT 
          cp.id,
          'CONTENT_SALE'::text as type,
          ci.title as description,
          cp.price_paid as gross_amount,
          cp.price_paid * 0.70 as net_amount,
          cp.price_paid * 0.30 as platform_fee,
          cp.created_at as date,
          u.name as buyer_name
        FROM content_purchases cp
        JOIN content_items ci ON cp.content_item_id = ci.id
        JOIN "user" u ON cp.user_id = u.id
        WHERE ci.creator_id = $1
        
        UNION ALL

        -- Regalos (Gifts)
        SELECT 
          gt.id,
          'GIFT'::text as type,
          vg.name as description,
          gt.coins_spent as gross_amount,
          gt.coins_spent * 0.70 as net_amount,
          gt.coins_spent * 0.30 as platform_fee,
          gt.created_at as date,
          u.name as buyer_name
        FROM gift_transactions gt
        JOIN virtual_gifts vg ON gt.gift_id = vg.gift_id
        JOIN "user" u ON gt.user_id = u.id
        WHERE gt.creator_id = $1
      )
      SELECT * FROM all_earnings
      WHERE 
        ($2::timestamp IS NULL OR date >= $2) AND
        ($3::timestamp IS NULL OR date <= $3)
      ORDER BY date DESC
      LIMIT $4 OFFSET $5;
    `;

    const countQuery = `
      SELECT COUNT(*) FROM (
        SELECT cp.id FROM content_purchases cp 
        JOIN content_items ci ON cp.content_item_id = ci.id 
        WHERE ci.creator_id = $1
        UNION ALL
        SELECT gt.id FROM gift_transactions gt 
        WHERE gt.creator_id = $1
      ) as total;
    `;

    const [results, totalRes] = await Promise.all([
      this.pool.query(query, [creatorId, startDate, endDate, limit, offset]),
      this.pool.query(countQuery, [creatorId]),
    ]);

    const transactions: EarningTransactionDTO[] = results.rows.map((row) => ({
      id: row.id,
      type: row.type as 'CONTENT_SALE' | 'GIFT' | 'VIDEO_CALL',
      description: row.description,
      grossAmount: parseFloat(row.gross_amount),
      netAmount: parseFloat(row.net_amount),
      platformFee: parseFloat(row.platform_fee),
      date: row.date,
      buyerName: row.buyer_name,
    }));

    const totalCount = parseInt(totalRes.rows[0].count, 10);

    return {
      transactions,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    };
  }
}
