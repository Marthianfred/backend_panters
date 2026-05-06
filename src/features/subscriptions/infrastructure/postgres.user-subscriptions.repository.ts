import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { IUserSubscriptionsRepository } from '../interfaces/user.subscriptions.repository.interface';
import {
  UserSubscriptionDto,
  CreateUserSubscriptionDto,
  UserSubscriptionWithPlanDto,
} from '../subscriptions.models';

@Injectable()
export class PostgresUserSubscriptionsRepository implements IUserSubscriptionsRepository {
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.getOrThrow<string>('DATABASE_URL'),
    });
  }

  async create(data: CreateUserSubscriptionDto): Promise<UserSubscriptionDto> {
    const query = `
      INSERT INTO user_subscriptions (
        user_id, plan_id, status, payment_gateway, external_subscription_id, cancel_at_period_end, starts_at, ends_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING 
        id, 
        user_id as "userId", 
        plan_id as "planId", 
        status, 
        payment_gateway as "paymentGateway", 
        external_subscription_id as "externalSubscriptionId", 
        cancel_at_period_end as "cancelAtPeriodEnd",
        starts_at as "startsAt", 
        ends_at as "endsAt", 
        created_at as "createdAt", 
        updated_at as "updatedAt";
    `;

    const values = [
      data.userId,
      data.planId,
      data.status || 'pending',
      data.paymentGateway,
      data.externalSubscriptionId,
      data.cancelAtPeriodEnd || false,
      data.startsAt,
      data.endsAt,
    ];

    const result = await this.pool.query<UserSubscriptionDto>(query, values);
    return result.rows[0];
  }

  async findByUserId(userId: string): Promise<UserSubscriptionDto[]> {
    const query = `
      SELECT 
        id, user_id as "userId", plan_id as "planId", status, 
        payment_gateway as "paymentGateway", external_subscription_id as "externalSubscriptionId", 
        cancel_at_period_end as "cancelAtPeriodEnd",
        starts_at as "startsAt", ends_at as "endsAt", created_at as "createdAt", updated_at as "updatedAt"
      FROM user_subscriptions
      WHERE user_id = $1
      ORDER BY created_at DESC;
    `;
    const result = await this.pool.query<UserSubscriptionDto>(query, [userId]);
    return result.rows;
  }

  async findActiveByUserId(
    userId: string,
  ): Promise<UserSubscriptionDto | null> {
    const query = `
      SELECT 
        id, user_id as "userId", plan_id as "planId", status, 
        payment_gateway as "paymentGateway", external_subscription_id as "externalSubscriptionId", 
        cancel_at_period_end as "cancelAtPeriodEnd",
        starts_at as "startsAt", ends_at as "endsAt", created_at as "createdAt", updated_at as "updatedAt"
      FROM user_subscriptions
      WHERE user_id = $1 AND status = 'active' AND (ends_at IS NULL OR ends_at > NOW())
      LIMIT 1;
    `;
    const result = await this.pool.query<UserSubscriptionDto>(query, [userId]);
    return result.rows[0] || null;
  }

  async updateStatus(
    id: string,
    status: string,
    externalId?: string,
  ): Promise<UserSubscriptionDto> {
    const query = `
      UPDATE user_subscriptions
      SET status = $2, external_subscription_id = COALESCE($3, external_subscription_id), updated_at = NOW()
      WHERE id = $1
      RETURNING 
        id, user_id as "userId", plan_id as "planId", status, 
        payment_gateway as "paymentGateway", external_subscription_id as "externalSubscriptionId", 
        cancel_at_period_end as "cancelAtPeriodEnd",
        starts_at as "startsAt", ends_at as "endsAt", created_at as "createdAt", updated_at as "updatedAt";
    `;
    const result = await this.pool.query<UserSubscriptionDto>(query, [
      id,
      status,
      externalId,
    ]);
    return result.rows[0];
  }

  async findById(id: string): Promise<UserSubscriptionDto | null> {
    const query = `
      SELECT 
        id, user_id as "userId", plan_id as "planId", status, 
        payment_gateway as "paymentGateway", external_subscription_id as "externalSubscriptionId", 
        cancel_at_period_end as "cancelAtPeriodEnd",
        starts_at as "startsAt", ends_at as "endsAt", created_at as "createdAt", updated_at as "updatedAt"
      FROM user_subscriptions
      WHERE id = $1;
    `;
    const result = await this.pool.query<UserSubscriptionDto>(query, [id]);
    return result.rows[0] || null;
  }

  async findByExternalId(
    externalId: string,
  ): Promise<UserSubscriptionDto | null> {
    const query = `
      SELECT 
        id, user_id as "userId", plan_id as "planId", status, 
        payment_gateway as "paymentGateway", external_subscription_id as "externalSubscriptionId", 
        cancel_at_period_end as "cancelAtPeriodEnd",
        starts_at as "startsAt", ends_at as "endsAt", created_at as "createdAt", updated_at as "updatedAt"
      FROM user_subscriptions
      WHERE external_subscription_id = $1
      LIMIT 1;
    `;
    const result = await this.pool.query<UserSubscriptionDto>(query, [
      externalId,
    ]);
    return result.rows[0] || null;
  }

  async updatePeriod(
    id: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<UserSubscriptionDto> {
    const query = `
      UPDATE user_subscriptions
      SET starts_at = $2, ends_at = $3, status = 'active', updated_at = NOW()
      WHERE id = $1
      RETURNING 
        id, user_id as "userId", plan_id as "planId", status, 
        payment_gateway as "paymentGateway", external_subscription_id as "externalSubscriptionId", 
        cancel_at_period_end as "cancelAtPeriodEnd",
        starts_at as "startsAt", ends_at as "endsAt", created_at as "createdAt", updated_at as "updatedAt";
    `;
    const result = await this.pool.query<UserSubscriptionDto>(query, [
      id,
      startsAt,
      endsAt,
    ]);
    return result.rows[0];
  }

  async findActiveWithPlanByUserId(
    userId: string,
  ): Promise<UserSubscriptionWithPlanDto | null> {
    const query = `
      SELECT 
        s.id, 
        s.status, 
        p.name as "planName", 
        s.ends_at as "currentPeriodEnd", 
        s.cancel_at_period_end as "cancelAtPeriodEnd"
      FROM user_subscriptions s
      JOIN subscription_plans p ON s.plan_id = p.id
      WHERE s.user_id = $1 AND s.status = 'active' AND (s.ends_at IS NULL OR s.ends_at > NOW())
      ORDER BY s.created_at DESC
      LIMIT 1;
    `;
    const result = await this.pool.query<UserSubscriptionWithPlanDto>(query, [
      userId,
    ]);
    return result.rows[0] || null;
  }

  async changePlan(
    id: string,
    planId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<UserSubscriptionDto> {
    const query = `
      UPDATE user_subscriptions
      SET plan_id = $2, starts_at = $3, ends_at = $4, status = 'active', updated_at = NOW()
      WHERE id = $1
      RETURNING 
        id, user_id as "userId", plan_id as "planId", status, 
        payment_gateway as "paymentGateway", external_subscription_id as "externalSubscriptionId", 
        cancel_at_period_end as "cancelAtPeriodEnd",
        starts_at as "startsAt", ends_at as "endsAt", created_at as "createdAt", updated_at as "updatedAt";
    `;
    const result = await this.pool.query<UserSubscriptionDto>(query, [
      id,
      planId,
      startsAt,
      endsAt,
    ]);
    return result.rows[0];
  }

  async markExpiredSubscriptions(now: Date): Promise<number> {
    const query = `
      UPDATE user_subscriptions
      SET status = 'expired', updated_at = NOW()
      WHERE status = 'active' AND ends_at IS NOT NULL AND ends_at < $1;
    `;
    const result = await this.pool.query(query, [now]);
    return result.rowCount || 0;
  }
}
