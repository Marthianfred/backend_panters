import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { ISubscriptionPlanRepository } from '../domain/subscription-plan.repository.interface';
import { SubscriptionPlanEntity } from '../domain/subscription-plan.entity';

@Injectable()
export class PostgresSubscriptionPlanRepository implements ISubscriptionPlanRepository {
  private readonly pool: Pool;
  private readonly logger = new Logger(PostgresSubscriptionPlanRepository.name);

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.getOrThrow<string>('DATABASE_URL'),
    });
  }

  async create(
    plan: Partial<SubscriptionPlanEntity>,
  ): Promise<SubscriptionPlanEntity> {
    const query = `
      INSERT INTO subscription_plans (
        name, description, price_usd, duration_days, benefits, stripe_price_id, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING 
        id, name, description, 
        price_usd AS "priceUsd", 
        duration_days AS "durationDays", 
        benefits, 
        stripe_price_id AS "stripePriceId", 
        is_active AS "isActive", 
        created_at AS "createdAt", 
        updated_at AS "updatedAt";
    `;

    const values = [
      plan.name,
      plan.description,
      plan.priceUsd,
      plan.durationDays,
      JSON.stringify(plan.benefits),
      plan.stripePriceId,
      plan.isActive,
    ];

    try {
      const result = await this.pool.query(query, values);
      return new SubscriptionPlanEntity(result.rows[0]);
    } catch (error) {
      this.logger.error(`Error al crear plan de suscripción: ${error.message}`);
      throw error;
    }
  }

  async update(
    id: string,
    plan: Partial<SubscriptionPlanEntity>,
  ): Promise<SubscriptionPlanEntity> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (plan.name) {
      fields.push(`name = $${idx++}`);
      values.push(plan.name);
    }
    if (plan.description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(plan.description);
    }
    if (plan.priceUsd !== undefined) {
      fields.push(`price_usd = $${idx++}`);
      values.push(plan.priceUsd);
    }
    if (plan.durationDays !== undefined) {
      fields.push(`duration_days = $${idx++}`);
      values.push(plan.durationDays);
    }
    if (plan.benefits) {
      fields.push(`benefits = $${idx++}`);
      values.push(JSON.stringify(plan.benefits));
    }
    if (plan.stripePriceId !== undefined) {
      fields.push(`stripe_price_id = $${idx++}`);
      values.push(plan.stripePriceId);
    }
    if (plan.isActive !== undefined) {
      fields.push(`is_active = $${idx++}`);
      values.push(plan.isActive);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE subscription_plans 
      SET ${fields.join(', ')} 
      WHERE id = $${idx}
      RETURNING 
        id, name, description, 
        price_usd AS "priceUsd", 
        duration_days AS "durationDays", 
        benefits, 
        stripe_price_id AS "stripePriceId", 
        is_active AS "isActive", 
        created_at AS "createdAt", 
        updated_at AS "updatedAt";
    `;

    try {
      const result = await this.pool.query(query, values);
      return new SubscriptionPlanEntity(result.rows[0]);
    } catch (error) {
      this.logger.error(
        `Error al actualizar plan de suscripción ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async findById(id: string): Promise<SubscriptionPlanEntity | null> {
    const query = `
      SELECT 
        id, name, description, 
        price_usd AS "priceUsd", 
        duration_days AS "durationDays", 
        benefits, 
        stripe_price_id AS "stripePriceId", 
        is_active AS "isActive", 
        created_at AS "createdAt", 
        updated_at AS "updatedAt"
      FROM subscription_plans
      WHERE id = $1;
    `;

    try {
      const result = await this.pool.query(query, [id]);
      return result.rows.length > 0
        ? new SubscriptionPlanEntity(result.rows[0])
        : null;
    } catch (error) {
      this.logger.error(
        `Error al buscar plan de suscripción ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async findAll(): Promise<SubscriptionPlanEntity[]> {
    const query = `
      SELECT 
        id, name, description, 
        price_usd AS "priceUsd", 
        duration_days AS "durationDays", 
        benefits, 
        stripe_price_id AS "stripePriceId", 
        is_active AS "isActive", 
        created_at AS "createdAt", 
        updated_at AS "updatedAt"
      FROM subscription_plans
      ORDER BY price_usd ASC;
    `;

    try {
      const result = await this.pool.query(query);
      return result.rows.map((row) => new SubscriptionPlanEntity(row));
    } catch (error) {
      this.logger.error(
        `Error al listar planes de suscripción: ${error.message}`,
      );
      throw error;
    }
  }

  async toggleStatus(id: string, isActive: boolean): Promise<void> {
    const query = `UPDATE subscription_plans SET is_active = $1, updated_at = NOW() WHERE id = $2;`;
    try {
      await this.pool.query(query, [isActive, id]);
    } catch (error) {
      this.logger.error(
        `Error al cambiar estado del plan ${id}: ${error.message}`,
      );
      throw error;
    }
  }
}
