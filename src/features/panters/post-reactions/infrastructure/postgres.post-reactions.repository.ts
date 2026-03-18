import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { IPostReactionRepository } from '../interfaces/post-reactions.repository.interface';

@Injectable()
export class PostgresPostReactionRepository implements IPostReactionRepository {
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.getOrThrow<string>('DATABASE_URL'),
    });
  }

  async postExists(postId: string): Promise<boolean> {
    const query = `SELECT 1 FROM public.content_items WHERE id = $1 LIMIT 1;`;
    const result = await this.pool.query(query, [postId]);
    return result.rows.length > 0;
  }

  async getPostOwnerId(postId: string): Promise<string | null> {
    const query = `SELECT creator_id FROM public.content_items WHERE id = $1;`;
    const result = await this.pool.query(query, [postId]);
    return result.rows[0]?.creator_id || null;
  }

  async upsertReaction(userId: string, postId: string): Promise<number> {
    // Registro de la reacción social "pantera" (idempotente)
    const upsertQuery = `
      INSERT INTO public.post_reactions (user_id, post_id, created_at)
      VALUES ($1, $2, now())
      ON CONFLICT (user_id, post_id) DO NOTHING;
    `;
    await this.pool.query(upsertQuery, [userId, postId]);

    // Conteo total para devolver al muro
    const countQuery = `
      SELECT COUNT(*)::INT as total 
      FROM public.post_reactions 
      WHERE post_id = $1;
    `;
    const result = await this.pool.query(countQuery, [postId]);
    return result.rows[0].total;
  }
}
