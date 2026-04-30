import { Injectable, Inject } from '@nestjs/common';
import { PUSH_SUBSCRIPTION_REPOSITORY_TOKEN } from '../../domain/push-subscription.repository';
import type { PushSubscriptionRepository } from '../../domain/push-subscription.repository';
import { PushSubscription } from '../../domain/push-subscription.entity';
import { RegisterSubscriptionDto } from '../../api/dtos/register-subscription.dto';

@Injectable()
export class RegisterSubscriptionUseCase {
  constructor(
    @Inject(PUSH_SUBSCRIPTION_REPOSITORY_TOKEN)
    private readonly repository: PushSubscriptionRepository,
  ) {}

  async execute(userId: string, dto: RegisterSubscriptionDto): Promise<void> {
    const subscription = PushSubscription.create({
      userId,
      endpoint: dto.endpoint,
      p256dh: dto.keys.p256dh,
      auth: dto.keys.auth,
    });

    await this.repository.save(subscription);
  }
}
