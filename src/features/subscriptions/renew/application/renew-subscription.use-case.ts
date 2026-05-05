import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as userSubscriptionsRepositoryInterface from '@/features/subscriptions/interfaces/user.subscriptions.repository.interface';
import * as subscriptionPlansRepositoryInterface from '@/features/subscriptions/interfaces/subscription.plans.repository.interface';
import { StripeService } from '@/core/infrastructure/stripe/stripe.service';
import { PostgresUsersManagementRepository } from '@/features/users/management/infrastructure/postgres.users-management.repository';

export interface RenewSubscriptionDto {
  userId: string;
}

export interface RenewSessionResponse {
  url: string;
  sessionId: string;
}

@Injectable()
export class RenewSubscriptionUseCase {
  constructor(
    @Inject(userSubscriptionsRepositoryInterface.USER_SUBSCRIPTIONS_REPOSITORY)
    private readonly userSubscriptionsRepository: userSubscriptionsRepositoryInterface.IUserSubscriptionsRepository,
    @Inject(subscriptionPlansRepositoryInterface.SUBSCRIPTION_PLANS_REPOSITORY)
    private readonly plansRepository: subscriptionPlansRepositoryInterface.ISubscriptionPlansRepository,
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
    private readonly usersRepository: PostgresUsersManagementRepository,
  ) {}

  async execute(dto: RenewSubscriptionDto): Promise<RenewSessionResponse> {
    const subscriptions = await this.userSubscriptionsRepository.findByUserId(
      dto.userId,
    );
    const subscription = subscriptions[0];

    if (!subscription) {
      throw new NotFoundException(
        'No se encontró una suscripción previa para renovar.',
      );
    }

    if (subscription.status !== 'active' && subscription.status !== 'expired') {
      throw new BadRequestException(
        'Solo se pueden renovar suscripciones activas o expiradas.',
      );
    }

    const plan = await this.plansRepository.findById(subscription.planId);
    if (!plan || !plan.stripePriceId) {
      throw new BadRequestException(
        'El plan asociado no tiene una pasarela de pago válida configurada.',
      );
    }

    const successUrl =
      this.configService.getOrThrow<string>('STRIPE_SUCCESS_URL');
    const cancelUrl =
      this.configService.getOrThrow<string>('STRIPE_CANCEL_URL');

    const user = await this.usersRepository.getUserDetails(subscription.userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    const stripeCustomerId = await this.stripeService.getOrCreateCustomer(
      user.email,
      user.name,
    );

    try {
      const session = await this.stripeService.createCheckoutSession({
        priceId: plan.stripePriceId,
        subscriptionId: subscription.id,
        customerId: stripeCustomerId,
        successUrl: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&subscription_id=${subscription.id}&renew=true`,
        cancelUrl: cancelUrl,
        metadata: {
          userId: subscription.userId,
          action: 'renew',
          planId: plan.id,
        },
      });

      if (!session.url) {
        throw new Error('No se pudo generar la URL de Stripe.');
      }

      return {
        url: session.url,
        sessionId: session.id,
      };
    } catch (error) {
      throw new BadRequestException(
        `Error al generar la sesión de renovación: ${error.message}`,
      );
    }
  }
}
