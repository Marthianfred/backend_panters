import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import {
  Content,
  IContentRepository,
} from '../interfaces/content.repository.interface';

interface ContentRow {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  type: string;
  price_coins: string;
  created_at: Date;
  file_url: string;
  thumbnail: string;
  access_type: string;
  creator_full_name: string;
  creator_avatar_url: string;
  creator_is_online: boolean;
  panteras_count: string;
  has_reacted: boolean;
}

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
        id, creator_id, title, description, type, price_coins, file_url, thumbnail, status, access_type
      ) VALUES (
        $1, $2, $3, $4, $5::content_type, $6, $7, $8, $9::content_status, $10
      ) ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        price_coins = EXCLUDED.price_coins,
        file_url = EXCLUDED.file_url,
        thumbnail = EXCLUDED.thumbnail,
        type = EXCLUDED.type::content_type,
        access_type = EXCLUDED.access_type,
        updated_at = NOW()
      RETURNING *;
    `;

    const values = [
      content.id,
      content.creatorId,
      content.title,
      content.description,
      content.type || 'photo',
      content.price,
      content.url || '',
      content.thumbnailUrl || '',
      'published',
      content.accessType || 'free',
    ];

    const result = await this.pool.query<ContentRow>(query, values);
    return this.mapToDomain(result.rows[0]);
  }

  public async listContents(params?: {
    creatorId?: string;
    published?: boolean;
    subscriberId?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<Content[]> {
    let query = `
      SELECT 
        c.*, 
        p.full_name as creator_full_name, 
        p.avatar_url as creator_avatar_url, 
        p.is_online as creator_is_online,
        (SELECT COUNT(*)::INT FROM public.post_reactions WHERE post_id = c.id) as panteras_count,
        EXISTS(SELECT 1 FROM public.post_reactions WHERE post_id = c.id AND user_id = $1) as has_reacted
      FROM content_items c
      LEFT JOIN antigravity_profiles p ON c.creator_id = p.user_id
      WHERE 1=1
    `;
    const values: any[] = [params?.subscriberId || null];

    if (params?.creatorId) {
      values.push(params.creatorId);
      // El cliente envía el ID del usuario como creador para el filtro del muro.
      query += ` AND c.creator_id = $${values.length}`;
    }

    if (params?.type) {
      values.push(params.type);
      query += ` AND c.type = $${values.length}::content_type`;
    }

    if (params?.published) {
      query += ` AND c.status = 'published'`;
    }

    // Ordenación por defecto
    query += ` ORDER BY c.created_at DESC`;

    // Paginación
    const limit = params?.limit || 20;
    const page = params?.page || 1;
    const offset = (page - 1) * limit;

    values.push(limit, offset);
    query += ` LIMIT $${values.length - 1} OFFSET $${values.length}`;

    const result = await this.pool.query<ContentRow>(query, values);
    return result.rows.map((row) => this.mapToDomain(row));
  }

  public async countContents(params?: {
    creatorId?: string;
    published?: boolean;
    type?: string;
  }): Promise<number> {
    let query = `SELECT COUNT(*)::INT FROM content_items c WHERE 1=1`;
    const values: any[] = [];

    if (params?.creatorId) {
      values.push(params.creatorId);
      query += ` AND c.creator_id = $${values.length}`;
    }

    if (params?.type) {
      values.push(params.type);
      query += ` AND c.type = $${values.length}::content_type`;
    }

    if (params?.published) {
      query += ` AND c.status = 'published'`;
    }

    const result = await this.pool.query(query, values);
    return result.rows[0].count;
  }

  public async getContentById(id: string): Promise<Content | null> {
    const query = 'SELECT * FROM content_items WHERE id = $1';
    const result = await this.pool.query<ContentRow>(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToDomain(result.rows[0]);
  }

  private mapToDomain(row: ContentRow): Content {
    return {
      id: row.id,
      creatorId: row.creator_id,
      title: row.title,
      description: row.description,
      type: row.type,
      price: parseFloat(row.price_coins),
      accessType: row.access_type || 'free',
      createdAt: row.created_at,
      url: row.file_url,
      thumbnailUrl: row.thumbnail,
      panterasCount: parseInt(row.panteras_count || '0', 10),
      hasReacted: row.has_reacted || false,
      creatorDetails: row.creator_full_name
        ? {
            fullName: row.creator_full_name,
            avatarUrl: row.creator_avatar_url,
            isOnline: row.creator_is_online,
          }
        : undefined,
    };
  }

  public async getPurchasedContentIds(userId: string): Promise<string[]> {
    const res = await this.pool.query(
      'SELECT content_item_id FROM content_purchases WHERE user_id = $1',
      [userId],
    );
    return res.rows.map(
      (row: { content_item_id: string }) => row.content_item_id,
    );
  }

  public async updateContent(
    id: string,
    updates: Partial<Content>,
  ): Promise<void> {
    const fields = Object.keys(updates);
    if (fields.length === 0) return;

    const setClause = fields
      .map((field, index) => {
        const column = this.mapToColumn(field);
        return `${column} = $${index + 2}`;
      })
      .join(', ');

    const query = `UPDATE content_items SET ${setClause}, updated_at = NOW() WHERE id = $1`;
    const values = [id, ...Object.values(updates)];

    await this.pool.query(query, values);
  }

  public async deleteContent(id: string): Promise<void> {
    const query = 'DELETE FROM content_items WHERE id = $1';
    await this.pool.query(query, [id]);
  }

  private mapToColumn(field: string): string {
    const mapping: Record<string, string> = {
      title: 'title',
      description: 'description',
      price: 'price_coins',
      type: 'type',
      url: 'file_url',
      thumbnailUrl: 'thumbnail',
      accessType: 'access_type',
    };
    return mapping[field] || field;
  }
}
