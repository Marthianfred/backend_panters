import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import {
  IPantersRepository,
  PanterData,
} from '../interfaces/panters.repository.interface';

@Injectable()
export class PostgresPantersRepository implements IPantersRepository {
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.getOrThrow<string>('DATABASE_URL'),
    });
  }

  public async getAllPanters(): Promise<PanterData[]> {
    
    
    
    
    
    
    const query = `
      SELECT 
        p.id as "id",
        p.user_id AS "userId", 
        p.full_name AS "fullName", 
        p.avatar_url AS "avatarUrl", 
        p.is_online AS "isOnline",
        p.reviews_count AS "reviewsCount",
        p.is_vip AS "isVip",
        p.services AS "services",
        COALESCE(reaction_counts.cnt, 0)::FLOAT as "rating"
      FROM antigravity_profiles p
      INNER JOIN "user" u ON p.user_id = u.id
      INNER JOIN roles r ON r.id = u."roleId"
      LEFT JOIN (
        SELECT ci.creator_id, COUNT(pr.id) as cnt
        FROM content_items ci
        JOIN post_reactions pr ON pr.post_id = ci.id
        GROUP BY ci.creator_id
      ) reaction_counts ON reaction_counts.creator_id = u.id
      WHERE p.is_active = true AND r.name = 'model';
    `;

    const result = await this.pool.query(query);
    return result.rows as PanterData[];
  }

  public async getRanking(limit: number = 6): Promise<PanterData[]> {
    const query = `
      SELECT 
        p.id as "id",
        p.user_id AS "userId", 
        p.full_name AS "fullName", 
        p.avatar_url AS "avatarUrl", 
        p.is_online AS "isOnline",
        p.reviews_count AS "reviewsCount",
        p.is_vip AS "isVip",
        p.services AS "services",
        COALESCE(reaction_counts.cnt, 0)::FLOAT as "rating"
      FROM antigravity_profiles p
      INNER JOIN "user" u ON p.user_id = u.id
      INNER JOIN roles r ON r.id = u."roleId"
      LEFT JOIN (
        SELECT ci.creator_id, COUNT(pr.id) as cnt
        FROM content_items ci
        JOIN post_reactions pr ON pr.post_id = ci.id
        GROUP BY ci.creator_id
      ) reaction_counts ON reaction_counts.creator_id = u.id
      WHERE p.is_active = true AND r.name = 'model'
      ORDER BY p.is_vip DESC, p.reviews_count DESC
      LIMIT $1;
    `;

    const result = await this.pool.query(query, [limit]);
    return result.rows as PanterData[];
  }
}
