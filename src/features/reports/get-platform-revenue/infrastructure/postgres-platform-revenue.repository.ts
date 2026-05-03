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

  async getRevenueMetrics(startDate?: Date, endDate?: Date): Promise<{
    totalGrossPtc: number;
    totalPlatformPtc: number;
    totalCreatorPtc: number;
  }> {
    let query = `
      SELECT 
        COALESCE(SUM(amount), 0) as total_gross,
        COALESCE(SUM(amount * 0.30), 0) as platform_fee,
        COALESCE(SUM(amount * 0.70), 0) as creator_share
      FROM wallet_transactions
      WHERE type = 'debit'
    `;

    const params: any[] = [];
    if (startDate) {
      query += ` AND created_at >= $${params.length + 1}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND created_at <= $${params.length + 1}`;
      params.push(endDate);
    }

    const result = await this.entityManager.query(query, params);
    const row = result[0];

    return {
      totalGrossPtc: parseFloat(row.total_gross),
      totalPlatformPtc: parseFloat(row.platform_fee),
      totalCreatorPtc: parseFloat(row.creator_share),
    };
  }
}
