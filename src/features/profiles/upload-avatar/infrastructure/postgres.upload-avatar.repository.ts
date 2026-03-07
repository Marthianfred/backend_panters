import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import type { IUploadAvatarRepository } from '../interfaces/upload-avatar.repository.interface';

@Injectable()
export class PostgresUploadAvatarRepository implements IUploadAvatarRepository {
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.getOrThrow<string>('DATABASE_URL'),
    });
  }

  public async updateAvatarUrl(
    userId: string,
    avatarUrl: string,
  ): Promise<boolean> {
    const query = `
      UPDATE antigravity_profiles 
      SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2 AND is_active = true
      RETURNING id;
    `;
    const result = await this.pool.query(query, [avatarUrl, userId]);
    return (result.rowCount ?? 0) > 0;
  }
}
