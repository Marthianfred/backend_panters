import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { IPanterRatingRepository } from '../interfaces/rate-panter.repository.interface';
import { RatePanterRequest, RatePanterResponse, GetPanterRatingSummaryResponse } from '../rate-panter.models';

@Injectable()
export class PostgresPanterRatingRepository implements IPanterRatingRepository {
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.getOrThrow<string>('DATABASE_URL'),
    });
  }

  async upsertRating(subscriberId: string, data: RatePanterRequest): Promise<RatePanterResponse> {
    const query = `
      INSERT INTO public.panter_ratings (creator_id, subscriber_id, rating, comment, updated_at)
      VALUES ($1, $2, $3, $4, now())
      ON CONFLICT (creator_id, subscriber_id)
      DO UPDATE SET 
        rating = EXCLUDED.rating,
        comment = EXCLUDED.comment,
        updated_at = now()
      RETURNING id, creator_id as "creatorId", subscriber_id as "subscriberId", rating, comment, created_at as "createdAt";
    `;

    const result = await this.pool.query(query, [data.creatorId, subscriberId, data.rating, data.comment]);
    return result.rows[0];
  }

  async getRatingSummary(creatorId: string): Promise<GetPanterRatingSummaryResponse> {
    const query = `
      SELECT 
        creator_id as "creatorId",
        COALESCE(AVG(rating), 0)::FLOAT as "averageRating",
        COUNT(*)::INT as "totalVotes"
      FROM public.panter_ratings
      WHERE creator_id = $1
      GROUP BY creator_id;
    `;

    const result = await this.pool.query(query, [creatorId]);
    
    if (result.rows.length === 0) {
      return {
        creatorId,
        averageRating: 0,
        totalVotes: 0,
      };
    }

    return result.rows[0];
  }

  async panterExists(creatorId: string): Promise<boolean> {
    const query = `SELECT 1 FROM public.antigravity_profiles WHERE id = $1 LIMIT 1;`;
    const result = await this.pool.query(query, [creatorId]);
    return result.rows.length > 0;
  }
}
