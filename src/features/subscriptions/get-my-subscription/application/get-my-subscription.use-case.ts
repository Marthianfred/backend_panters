import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_SUBSCRIPTIONS_REPOSITORY } from '../../interfaces/user.subscriptions.repository.interface';
import type { IUserSubscriptionsRepository } from '../../interfaces/user.subscriptions.repository.interface';
import { MySubscriptionResponseDto } from '../domain/my-subscription.dto';

@Injectable()
export class GetMySubscriptionUseCase {
  constructor(
    @Inject(USER_SUBSCRIPTIONS_REPOSITORY)
    private readonly subscriptionsRepository: IUserSubscriptionsRepository,
  ) {}

  async execute(userId: string): Promise<MySubscriptionResponseDto> {
    const subscription =
      await this.subscriptionsRepository.findActiveWithPlanByUserId(userId);

    if (!subscription) {
      throw new NotFoundException(
        'No se encontró una suscripción activa para este usuario.',
      );
    }

    return {
      id: subscription.id,
      status: subscription.status,
      planName: subscription.planName,
      currentPeriodEnd: subscription.currentPeriodEnd
        ? subscription.currentPeriodEnd.toISOString()
        : null,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    };
  }
}
