import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import {
  Content,
  IContentRepository,
} from '../interfaces/content.repository.interface';

@Injectable()
export class PostgresContentRepository implements IContentRepository {
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.getOrThrow<string>('DATABASE_URL'),
    });
  }

  public async saveContent(content: Content): Promise<Content> {
    const query = `
      INSERT INTO content_items (
        id, creator_id, title, description, type, price_coins, file_url, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      ) ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        price_coins = EXCLUDED.price_coins,
        file_url = EXCLUDED.file_url,
        updated_at = NOW()
      RETURNING *;
    `;

    const values = [
      content.id,
      content.creatorId,
      content.title,
      content.description,
      'video', // Por defecto video para cumplir con el esquema
      content.price,
      content.url || '',
      'published',
    ];

    const result = await this.pool.query(query, values);
    return this.mapToDomain(result.rows[0]);
  }

  public async listContents(params?: {
    creatorId?: string;
    published?: boolean;
  }): Promise<Content[]> {
    let query = 'SELECT * FROM content_items WHERE 1=1';
    const values: any[] = [];

    if (params?.creatorId) {
      values.push(params.creatorId);
      query += ` AND creator_id = $${values.length}`;
    }

    if (params?.published) {
      query += ` AND status = 'published'`;
    }

    const result = await this.pool.query(query, values);
    return result.rows.map((row) => this.mapToDomain(row));
  }

  public async getContentById(id: string): Promise<Content | null> {
    const query = 'SELECT * FROM content_items WHERE id = $1';
    const result = await this.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToDomain(result.rows[0]);
  }

  private mapToDomain(row: any): Content {
    return {
      id: row.id,
      creatorId: row.creator_id,
      title: row.title,
      description: row.description,
      price: parseFloat(row.price_coins),
      createdAt: row.created_at,
      url: row.file_url,
    };
  }
}
