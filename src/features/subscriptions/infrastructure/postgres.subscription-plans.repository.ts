import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { ISubscriptionPlansRepository } from '../interfaces/subscription.plans.repository.interface';
import { SubscriptionPlanDto, CreatePlanDto, UpdatePlanDto } from '../plans.models';

@Injectable()
export class PostgresSubscriptionPlansRepository implements ISubscriptionPlansRepository {
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.getOrThrow<string>('DATABASE_URL'),
    });
  }

  async create(plan: CreatePlanDto): Promise<SubscriptionPlanDto> {
    const query = `
      INSERT INTO public.subscription_plans 
      (name, description, price_usd, duration_days, benefits, stripe_price_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const result = await this.pool.query(query, [
      plan.name,
      plan.description || '',
      plan.priceUsd,
      plan.durationDays,
      JSON.stringify(plan.benefits || []),
      plan.stripePriceId || null,
    ]);
    return this.mapToDto(result.rows[0]);
  }

  async findAll(): Promise<SubscriptionPlanDto[]> {
    const query = 'SELECT * FROM public.subscription_plans WHERE is_active = true ORDER BY created_at ASC;';
    const result = await this.pool.query(query);
    return result.rows.map(row => this.mapToDto(row));
  }

  async findById(id: string): Promise<SubscriptionPlanDto | null> {
    const query = 'SELECT * FROM public.subscription_plans WHERE id = $1;';
    const result = await this.pool.query(query, [id]);
    if (result.rows.length === 0) return null;
    return this.mapToDto(result.rows[0]);
  }

  async findByStripePriceId(stripePriceId: string): Promise<SubscriptionPlanDto | null> {
    const query = 'SELECT * FROM public.subscription_plans WHERE stripe_price_id = $1;';
    const result = await this.pool.query(query, [stripePriceId]);
    if (result.rows.length === 0) return null;
    return this.mapToDto(result.rows[0]);
  }

  async update(id: string, updates: UpdatePlanDto): Promise<SubscriptionPlanDto> {
    const current = await this.findById(id);
    if (!current) throw new NotFoundException('Plan no encontrado');

    const fieldsSchema = {
      name: updates.name,
      description: updates.description,
      price_usd: updates.priceUsd,
      duration_days: updates.durationDays,
      benefits: updates.benefits ? JSON.stringify(updates.benefits) : undefined,
      stripe_price_id: updates.stripePriceId,
      is_active: updates.isActive,
    };

    const keys = Object.keys(fieldsSchema).filter(k => fieldsSchema[k] !== undefined);
    if (keys.length === 0) return current;

    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
    const query = `UPDATE public.subscription_plans SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *;`;
    const values = [id, ...keys.map(k => fieldsSchema[k])];

    const result = await this.pool.query(query, values);
    return this.mapToDto(result.rows[0]);
  }

  async delete(id: string): Promise<void> {
    // Como Tech Lead, prefiero desactivar el plan en lugar de borrarlo físicamente
    // para mantener integridad referencial histórica en las suscripciones anteriores.
    const query = 'UPDATE public.subscription_plans SET is_active = false, updated_at = NOW() WHERE id = $1;';
    await this.pool.query(query, [id]);
  }

  private mapToDto(row: any): SubscriptionPlanDto {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      priceUsd: parseFloat(row.price_usd),
      durationDays: row.duration_days,
      benefits: Array.isArray(row.benefits) ? row.benefits : JSON.parse(row.benefits || '[]'),
      stripePriceId: row.stripe_price_id,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
