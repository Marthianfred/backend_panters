import { PushSubscription } from './push-subscription.entity';

export const PUSH_SUBSCRIPTION_REPOSITORY_TOKEN = 'PUSH_SUBSCRIPTION_REPOSITORY_TOKEN';

export interface PushSubscriptionRepository {
  save(subscription: PushSubscription): Promise<void>;
  findByUserId(userId: string): Promise<PushSubscription[]>;
  findByRole(role: string): Promise<PushSubscription[]>;
  deleteByEndpoint(endpoint: string): Promise<void>;
}
