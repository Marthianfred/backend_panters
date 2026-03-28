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
                id,
                creator_id AS "creatorId",
                channel_arn AS "channelArn", 
                aws_region AS "region", 
                s3_thumbnail_bucket AS "s3ThumbnailBucket", 
                s3_thumbnail_key AS "s3ThumbnailKey",
                is_active AS "isActive"
            FROM antigravity_streams 
            WHERE id = $1 AND is_active = true;
        `;

    const result = await this.pool.query(query, [streamId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0] as StreamMetadata;
  }

  public async createStream(stream: StreamMetadata): Promise<void> {
    const query = `
      INSERT INTO antigravity_streams (
        id, creator_id, channel_arn, aws_region, s3_thumbnail_bucket, s3_thumbnail_key, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    const values = [
      stream.id,
      stream.creatorId,
      stream.channelArn,
      stream.region,
      stream.s3ThumbnailBucket,
      stream.s3ThumbnailKey,
      stream.isActive,
    ];

    await this.pool.query(query, values);
  }

  public async getActiveStreams(): Promise<StreamMetadata[]> {
    const query = `
      SELECT 
        id,
        creator_id AS "creatorId",
        channel_arn AS "channelArn", 
        aws_region AS "region", 
        s3_thumbnail_bucket AS "s3ThumbnailBucket", 
        s3_thumbnail_key AS "s3ThumbnailKey",
        is_active AS "isActive"
      FROM antigravity_streams 
      WHERE is_active = true 
      AND created_at > NOW() - INTERVAL '4 hours'
      ORDER BY created_at DESC;
    `;

    const result = await this.pool.query(query);
    return result.rows as StreamMetadata[];
  }
}
