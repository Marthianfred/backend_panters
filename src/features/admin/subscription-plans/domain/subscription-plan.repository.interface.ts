import { SubscriptionPlanEntity } from './subscription-plan.entity';

export const SUBSCRIPTION_PLAN_REPOSITORY = 'SUBSCRIPTION_PLAN_REPOSITORY';

export interface ISubscriptionPlanRepository {
  create(
    plan: Partial<SubscriptionPlanEntity>,
  ): Promise<SubscriptionPlanEntity>;
  update(
    id: string,
    plan: Partial<SubscriptionPlanEntity>,
  ): Promise<SubscriptionPlanEntity>;
  findById(id: string): Promise<SubscriptionPlanEntity | null>;
  findAll(): Promise<SubscriptionPlanEntity[]>;
  toggleStatus(id: string, isActive: boolean): Promise<void>;
}
