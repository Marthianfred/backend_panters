import { SubscriptionPlanDto, CreatePlanDto, UpdatePlanDto } from '../plans.models';

export const SUBSCRIPTION_PLANS_REPOSITORY = Symbol('ISubscriptionPlansRepository');

export interface ISubscriptionPlansRepository {
  create(plan: CreatePlanDto): Promise<SubscriptionPlanDto>;
  findAll(): Promise<SubscriptionPlanDto[]>;
  findById(id: string): Promise<SubscriptionPlanDto | null>;
  update(id: string, updates: UpdatePlanDto): Promise<SubscriptionPlanDto>;
  delete(id: string): Promise<void>;
  findByStripePriceId(stripePriceId: string): Promise<SubscriptionPlanDto | null>;
}
