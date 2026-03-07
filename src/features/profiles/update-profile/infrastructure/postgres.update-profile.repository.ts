import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import type {
  IUpdateProfileRepository,
  UpdatedProfileData,
} from '../interfaces/update-profile.repository.interface';

@Injectable()
export class PostgresUpdateProfileRepository implements IUpdateProfileRepository {
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.getOrThrow<string>('DATABASE_URL'),
    });
  }

  public async updateProfileByUserId(
    userId: string,
    data: { fullName?: string; avatarUrl?: string; bio?: string },
  ): Promise<UpdatedProfileData | null> {
    const fields: string[] = [];
    const values: (string | number | boolean | null)[] = [];
    let queryIndex = 1;

    if (data.fullName !== undefined) {
      fields.push(`full_name = $${queryIndex++}`);
      values.push(data.fullName);
    }
    if (data.avatarUrl !== undefined) {
      fields.push(`avatar_url = $${queryIndex++}`);
      values.push(data.avatarUrl);
    }
    if (data.bio !== undefined) {
      fields.push(`bio = $${queryIndex++}`);
      values.push(data.bio);
    }

    if (fields.length === 0) {
      // Nothing to update, return the current profile
      const result = await this.pool.query(
        `SELECT id, user_id AS "userId", full_name AS "fullName", avatar_url AS "avatarUrl", bio 
         FROM antigravity_profiles WHERE user_id = $1 AND is_active = true`,
        [userId],
      );
      return (result.rows[0] as UpdatedProfileData) || null;
    }

    // Always update the updated_at timestamp
    fields.push(`updated_at = CURRENT_TIMESTAMP`);

    values.push(userId);
    const query = `
      UPDATE antigravity_profiles
      SET ${fields.join(', ')}
      WHERE user_id = $${queryIndex} AND is_active = true
      RETURNING 
        id as "id",
        user_id AS "userId", 
        full_name AS "fullName", 
        avatar_url AS "avatarUrl", 
        bio AS "bio";
    `;

    const result = await this.pool.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as UpdatedProfileData;
  }
}
