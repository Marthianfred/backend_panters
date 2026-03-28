import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { IHomeVideoRepository } from '../interfaces/home-video.repository.interface';
import { HomeVideo } from '../home-video.entity';

@Injectable()
export class PostgresHomeVideoRepository implements IHomeVideoRepository {
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.getOrThrow<string>('DATABASE_URL'),
    });
  }

  public async getAll(): Promise<HomeVideo[]> {
    const query = `
      SELECT 
        id, 
        key, 
        url, 
        original_name AS "originalName", 
        mime_type AS "mimeType", 
        created_at AS "createdAt"
      FROM public.home_loop_videos
      ORDER BY created_at DESC;
    `;
    const result = await this.pool.query(query);
    return result.rows.map(row => ({
      ...row,
      createdAt: new Date(row.createdAt),
    }));
  }

  public async getById(id: string): Promise<HomeVideo | null> {
    const query = `
      SELECT 
        id, 
        key, 
        url, 
        original_name AS "originalName", 
        mime_type AS "mimeType", 
        created_at AS "createdAt"
      FROM public.home_loop_videos
      WHERE id = $1;
    `;
    const result = await this.pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      ...row,
      createdAt: new Date(row.createdAt),
    };
  }

  public async save(video: HomeVideo): Promise<void> {
    const query = `
      INSERT INTO public.home_loop_videos (id, key, url, original_name, mime_type, created_at)
      VALUES ($1, $2, $3, $4, $5, $6);
    `;
    await this.pool.query(query, [
      video.id,
      video.key,
      video.url,
      video.originalName,
      video.mimeType,
      video.createdAt,
    ]);
  }

  public async delete(id: string): Promise<void> {
    const query = 'DELETE FROM public.home_loop_videos WHERE id = $1;';
    await this.pool.query(query, [id]);
  }
}
