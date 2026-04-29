import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as userSubscriptionsRepositoryInterface from '@/features/subscriptions/interfaces/user.subscriptions.repository.interface';
import * as subscriptionPlansRepositoryInterface from '@/features/subscriptions/interfaces/subscription.plans.repository.interface';
import { StripeService } from '@/core/infrastructure/stripe/stripe.service';
import { PostgresUsersManagementRepository } from '@/features/users/management/infrastructure/postgres.users-management.repository';
import { UpgradeSubscriptionDto, UpgradeSessionResponse } from '../domain/upgrade-subscription.dto';

@Injectable()
export class UpgradeSubscriptionUseCase {
  constructor(
    @Inject(userSubscriptionsRepositoryInterface.USER_SUBSCRIPTIONS_REPOSITORY)
    private readonly userSubscriptionsRepository: userSubscriptionsRepositoryInterface.IUserSubscriptionsRepository,
    @Inject(subscriptionPlansRepositoryInterface.SUBSCRIPTION_PLANS_REPOSITORY)
    private readonly plansRepository: subscriptionPlansRepositoryInterface.ISubscriptionPlansRepository,
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
    private readonly usersRepository: PostgresUsersManagementRepository,
  ) {}

  async execute(userId: string, dto: UpgradeSubscriptionDto): Promise<UpgradeSessionResponse> {
    // 1. Obtener suscripción activa
    const subscription = await this.userSubscriptionsRepository.findActiveByUserId(userId);
    if (!subscription) {
      throw new NotFoundException('No tienes una suscripción activa para realizar un upgrade.');
    }

    // 2. Obtener plan actual y plan objetivo
    const currentPlan = await this.plansRepository.findById(subscription.planId);
    if (!currentPlan) {
      throw new NotFoundException('Plan actual no encontrado.');
    }
    const targetPlan = await this.plansRepository.findById(dto.targetPlanId);

    if (!targetPlan || !targetPlan.isActive) {
      throw new NotFoundException('El plan objetivo no existe o no está activo.');
    }

    // 3. Validar que sea un upgrade (precio mayor)
    const currentPrice = Number(currentPlan.priceUsd);
    const targetPrice = Number(targetPlan.priceUsd);

    if (targetPrice <= currentPrice) {
      throw new BadRequestException('El plan seleccionado debe tener un valor superior al plan actual para considerarse un upgrade.');
    }

    if (!targetPlan.stripePriceId) {
      throw new BadRequestException('El plan objetivo no tiene una pasarela de pago configurada.');
    }

    // 4. Preparar sesión de Stripe
    const user = await this.usersRepository.getUserDetails(userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }
    const stripeCustomerId = await this.stripeService.getOrCreateCustomer(user.email, user.name);
    
    const successUrl = this.configService.getOrThrow<string>('STRIPE_SUCCESS_URL');
    const cancelUrl = this.configService.getOrThrow<string>('STRIPE_CANCEL_URL');

    try {
      const session = await this.stripeService.createCheckoutSession({
        priceId: targetPlan.stripePriceId,
        subscriptionId: subscription.id,
        customerId: stripeCustomerId,
        successUrl: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&upgrade=true`,
        cancelUrl: cancelUrl,
        metadata: {
          userId,
          action: 'upgrade',
          targetPlanId: targetPlan.id,
          previousPlanId: currentPlan.id,
        },
      });

      if (!session.url) {
        throw new Error('No se pudo generar la URL de pago de Stripe.');
      }

      return {
        url: session.url,
        sessionId: session.id,
      };

    } catch (error) {
      throw new BadRequestException(`Error al generar la sesión de upgrade: ${error.message}`);
    }
  }
}
