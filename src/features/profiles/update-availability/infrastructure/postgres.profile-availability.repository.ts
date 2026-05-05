import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import type {
  IProfileAvailabilityRepository,
  ProfileAvailabilityData,
} from '../interfaces/profile-availability.repository.interface';

@Injectable()
export class PostgresProfileAvailabilityRepository implements IProfileAvailabilityRepository {
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.getOrThrow<string>('DATABASE_URL'),
    });
  }

  public async updateAvailability(
    userId: string,
    isOnline: boolean,
  ): Promise<ProfileAvailabilityData | null> {
    const query = `
      UPDATE antigravity_profiles
      SET is_online = $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2
      RETURNING user_id AS "userId", is_online AS "isOnline";
    `;

    const result = await this.pool.query(query, [isOnline, userId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as ProfileAvailabilityData;
  }

  public async getAvailability(
    userId: string,
  ): Promise<ProfileAvailabilityData | null> {
    const query = `
      SELECT user_id AS "userId", is_online AS "isOnline"
      FROM antigravity_profiles
      WHERE user_id = $1;
    `;

    const result = await this.pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as ProfileAvailabilityData;
  }
}
