import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

export interface StripeEventRecord {
  id: string;
  type: string;
  status: 'processing' | 'completed' | 'failed';
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class StripeEventRepository {
  private readonly pool: Pool;
  private readonly logger = new Logger(StripeEventRepository.name);

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.getOrThrow<string>('DATABASE_URL'),
    });
  }

  /**
   * Verifica si un evento ya ha sido procesado o está en proceso.
   */
  async findById(id: string): Promise<StripeEventRecord | null> {
    const query = `
      SELECT id, type, status, metadata, created_at as "createdAt", updated_at as "updatedAt"
      FROM stripe_processed_events
      WHERE id = $1;
    `;
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Registra el inicio del procesamiento de un evento.
   */
  async recordProcessing(id: string, type: string, metadata?: any): Promise<void> {
    const query = `
      INSERT INTO stripe_processed_events (id, type, status, metadata)
      VALUES ($1, $2, 'processing', $3)
      ON CONFLICT (id) DO NOTHING;
    `;
    await this.pool.query(query, [id, type, metadata ? JSON.stringify(metadata) : null]);
  }

  /**
   * Marca un evento como completado con éxito.
   */
  async markAsCompleted(id: string): Promise<void> {
    const query = `
      UPDATE stripe_processed_events
      SET status = 'completed', updated_at = NOW()
      WHERE id = $1;
    `;
    await this.pool.query(query, [id]);
  }

  /**
   * Marca un evento como fallido.
   */
  async markAsFailed(id: string): Promise<void> {
    const query = `
      UPDATE stripe_processed_events
      SET status = 'failed', updated_at = NOW()
      WHERE id = $1;
    `;
    await this.pool.query(query, [id]);
  }
}
