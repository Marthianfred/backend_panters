import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import {
  IProfileRepository,
  ProfileData,
} from '../interfaces/profile.repository.interface';

@Injectable()
export class PostgresProfileRepository implements IProfileRepository {
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.getOrThrow<string>('DATABASE_URL'),
    });
  }

  public async getProfileByUserId(userId: string): Promise<ProfileData | null> {
    const query = `
      SELECT 
        p.id AS "id",
        u.id AS "userId", 
        p.full_name AS "fullName", 
        p.avatar_url AS "avatarUrl", 
        p.bio AS "bio"
      FROM antigravity_profiles p
      INNER JOIN "user" u ON p.user_id = u.id
      WHERE p.user_id = $1 AND p.is_active = true LIMIT 1;
    `;

    const result = await this.pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as ProfileData;
  }
}
