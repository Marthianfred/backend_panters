import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_SUBSCRIPTIONS_REPOSITORY } from '../../interfaces/user.subscriptions.repository.interface';
import type { IUserSubscriptionsRepository } from '../../interfaces/user.subscriptions.repository.interface';
import { SubscriptionStatusResponseDto } from '../domain/subscription-status.dto';

@Injectable()
export class GetSubscriptionStatusUseCase {
  constructor(
    @Inject(USER_SUBSCRIPTIONS_REPOSITORY)
    private readonly subscriptionsRepository: IUserSubscriptionsRepository,
  ) {}

  async execute(subscriptionId: string): Promise<SubscriptionStatusResponseDto> {
    const subscription = await this.subscriptionsRepository.findById(subscriptionId);

    if (!subscription) {
      throw new NotFoundException(`Suscripción con ID ${subscriptionId} no encontrada`);
    }

    return {
      id: subscription.id,
      status: subscription.status,
      paymentGateway: subscription.paymentGateway ?? 'unknown',
      externalSubscriptionId: subscription.externalSubscriptionId ?? null,
      updatedAt: subscription.updatedAt,
    };
  }
}
