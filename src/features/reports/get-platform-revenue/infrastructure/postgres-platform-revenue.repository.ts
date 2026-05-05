import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import type { IPlatformRevenueRepository } from '../interfaces/platform-revenue-repository.interface';

@Injectable()
export class PostgresPlatformRevenueRepository implements IPlatformRevenueRepository {
  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
  ) {}

  async getRevenueMetrics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalGrossPtc: number;
    totalPlatformPtc: number;
    totalCreatorPtc: number;
    totalSubscriptionUsd: number;
  }> {
    const params: any[] = [];
    let dateFilter = '';
    let subDateFilter = '';

    if (startDate) {
      params.push(startDate);
      dateFilter += ` AND created_at >= $${params.length}`;
      subDateFilter += ` AND s.created_at >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      dateFilter += ` AND created_at <= $${params.length}`;
      subDateFilter += ` AND s.created_at <= $${params.length}`;
    }

    const query = `
      SELECT 
        (SELECT COALESCE(SUM(amount), 0) FROM wallet_transactions WHERE type = 'debit' ${dateFilter}) as total_gross,
        (SELECT COALESCE(SUM(amount * 0.30), 0) FROM wallet_transactions WHERE type = 'debit' ${dateFilter}) as platform_fee,
        (SELECT COALESCE(SUM(amount * 0.70), 0) FROM wallet_transactions WHERE type = 'debit' ${dateFilter}) as creator_share,
        (
          SELECT COALESCE(SUM(p.price_usd), 0) 
          FROM user_subscriptions s
          JOIN subscription_plans p ON s.plan_id = p.id
          WHERE s.status = 'active' ${subDateFilter}
        ) as total_subscriptions
    `;

    const result = await this.entityManager.query(query, params);
    const row = result[0];

    return {
      totalGrossPtc: parseFloat(row.total_gross),
      totalPlatformPtc: parseFloat(row.platform_fee),
      totalCreatorPtc: parseFloat(row.creator_share),
      totalSubscriptionUsd: parseFloat(row.total_subscriptions),
    };
  }
}
