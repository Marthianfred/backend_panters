import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import type { IPlatformSummaryRepository } from '../interfaces/platform-summary-repository.interface';

@Injectable()
export class PostgresPlatformSummaryRepository implements IPlatformSummaryRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async getActiveSubscribersCount(): Promise<number> {
    const query = `
      SELECT COUNT(DISTINCT user_id) as count 
      FROM user_subscriptions 
      WHERE status = 'active'
    `;
    const result = await this.entityManager.query(query);
    return parseInt(result[0].count);
  }

  async getNewUsersCount(startDate?: Date, endDate?: Date): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM "user" WHERE 1=1`;
    const params: any[] = [];

    if (startDate) {
      query += ` AND "createdAt" >= $${params.length + 1}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND "createdAt" <= $${params.length + 1}`;
      params.push(endDate);
    }

    const result = await this.entityManager.query(query, params);
    return parseInt(result[0].count);
  }

  async getFinancialStatsPerModel(startDate?: Date, endDate?: Date): Promise<Array<{
    creatorId: string;
    creatorName: string;
    totalEarnedPtc: number;
  }>> {
    const params: any[] = [];
    let dateFilter = '';
    
    if (startDate) {
      dateFilter += ` AND created_at >= $${params.length + 1}`;
      params.push(startDate);
    }
    if (endDate) {
      dateFilter += ` AND created_at <= $${params.length + 1}`;
      params.push(endDate);
    }

    // Combinamos regalos y ventas de contenido
    const query = `
      WITH model_revenue AS (
        -- Regalos
        SELECT creator_id, SUM(coins_spent) as amount
        FROM gift_transactions
        WHERE 1=1 ${dateFilter}
        GROUP BY creator_id
        
        UNION ALL
        
        -- Ventas de contenido
        SELECT ci.creator_id, SUM(cp.price_paid) as amount
        FROM content_purchases cp
        JOIN content_items ci ON cp.content_item_id = ci.id
        WHERE 1=1 ${dateFilter.replace(/created_at/g, 'cp.created_at')}
        GROUP BY ci.creator_id
      )
      SELECT 
        mr.creator_id as "creatorId",
        COALESCE(p.full_name, p.username, 'Usuario ' || mr.creator_id) as "creatorName",
        SUM(mr.amount) as "totalEarnedPtc"
      FROM model_revenue mr
      LEFT JOIN antigravity_profiles p ON mr.creator_id = p.user_id
      GROUP BY mr.creator_id, p.full_name, p.username
      ORDER BY "totalEarnedPtc" DESC
      LIMIT 10
    `;

    const result = await this.entityManager.query(query, params);
    return result.map(row => ({
      creatorId: row.creatorId,
      creatorName: row.creatorName,
      totalEarnedPtc: parseFloat(row.totalEarnedPtc),
    }));
  }
}
