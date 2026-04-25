import { UserSubscriptionDto, CreateUserSubscriptionDto } from '@/features/subscriptions/subscriptions.models';

export const USER_SUBSCRIPTIONS_REPOSITORY = Symbol('IUserSubscriptionsRepository');

export interface IUserSubscriptionsRepository {
  create(data: CreateUserSubscriptionDto): Promise<UserSubscriptionDto>;
  findByUserId(userId: string): Promise<UserSubscriptionDto[]>;
  findActiveByUserId(userId: string): Promise<UserSubscriptionDto | null>;
  updateStatus(id: string, status: string, externalId?: string): Promise<UserSubscriptionDto>;
  findById(id: string): Promise<UserSubscriptionDto | null>;
  findByExternalId(externalId: string): Promise<UserSubscriptionDto | null>;
  updatePeriod(id: string, startsAt: Date, endsAt: Date): Promise<UserSubscriptionDto>;
}
