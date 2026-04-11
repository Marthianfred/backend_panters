import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

export interface CreatorRanking {
  userId: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  totalReactions: number;
}

export const CREATORS_RANKINGS_REPOSITORY = 'CREATORS_RANKINGS_REPOSITORY';

export interface ICreatorsRankingsRepository {
  getTopCreators(limit: number): Promise<CreatorRanking[]>;
}

@Injectable()
export class PostgresCreatorsRankingsRepository implements ICreatorsRankingsRepository {
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.getOrThrow<string>('DATABASE_URL'),
    });
  }

  async getTopCreators(limit: number): Promise<CreatorRanking[]> {
    const query = `
      SELECT 
        u.id as "userId",
        ap.username,
        ap.full_name as "fullName",
        ap.avatar_url as "avatarUrl",
        COALESCE(reaction_counts.cnt, 0)::INT as "totalReactions"
      FROM public."user" u
      JOIN public.antigravity_profiles ap ON ap.user_id = u.id
      LEFT JOIN (
        SELECT ci.creator_id, COUNT(pr.id) as cnt
        FROM public.content_items ci
        JOIN public.post_reactions pr ON pr.post_id = ci.id
        GROUP BY ci.creator_id
      ) reaction_counts ON reaction_counts.creator_id = u.id
      WHERE u.role IN ('model', 'creator')
      ORDER BY "totalReactions" DESC
      LIMIT $1;
    `;

    const result = await this.pool.query(query, [limit]);
    return result.rows.map(row => ({
      userId: row.userId,
      username: row.username,
      fullName: row.fullName,
      avatarUrl: row.avatarUrl,
      totalReactions: row.totalReactions,
    }));
  }
}
