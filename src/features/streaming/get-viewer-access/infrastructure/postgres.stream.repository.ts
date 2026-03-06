import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import {
  IStreamRepository,
  StreamMetadata,
} from '../interfaces/stream.repository.interface';

@Injectable()
export class PostgresStreamRepository implements IStreamRepository {
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.getOrThrow<string>('DATABASE_URL'),
    });
  }

  public async getStreamMetadataById(
    streamId: string,
  ): Promise<StreamMetadata | null> {
    const query = `
            SELECT 
                channel_arn AS "channelArn", 
                aws_region AS "region", 
                s3_thumbnail_bucket AS "s3ThumbnailBucket", 
                s3_thumbnail_key AS "s3ThumbnailKey"
            FROM antigravity_streams 
            WHERE id = $1 AND is_active = true;
        `;

    const result = await this.pool.query(query, [streamId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as StreamMetadata;
  }
}
