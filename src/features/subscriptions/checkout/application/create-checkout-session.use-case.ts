import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as userSubscriptionsRepositoryInterface from '@/features/subscriptions/interfaces/user.subscriptions.repository.interface';
import * as subscriptionPlansRepositoryInterface from '@/features/subscriptions/interfaces/subscription.plans.repository.interface';
import { StripeService } from '@/core/infrastructure/stripe/stripe.service';
import { PostgresUsersManagementRepository } from '@/features/users/management/infrastructure/postgres.users-management.repository';

export interface CreateCheckoutSessionDto {
  subscriptionId: string;
}

export interface CheckoutSessionResponse {
  url: string;
  sessionId: string;
}

@Injectable()
export class CreateCheckoutSessionUseCase {
  constructor(
    @Inject(userSubscriptionsRepositoryInterface.USER_SUBSCRIPTIONS_REPOSITORY)
    private readonly userSubscriptionsRepository: userSubscriptionsRepositoryInterface.IUserSubscriptionsRepository,
    @Inject(subscriptionPlansRepositoryInterface.SUBSCRIPTION_PLANS_REPOSITORY)
    private readonly plansRepository: subscriptionPlansRepositoryInterface.ISubscriptionPlansRepository,
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
    private readonly usersRepository: PostgresUsersManagementRepository,
  ) {}

  async execute(dto: CreateCheckoutSessionDto): Promise<CheckoutSessionResponse> {
    // 1. Buscar la suscripción
    const subscription = await this.userSubscriptionsRepository.findById(dto.subscriptionId);
    if (!subscription) {
      throw new NotFoundException('Suscripción no encontrada.');
    }

    if (subscription.status === 'active') {
      throw new BadRequestException('Esta suscripción ya está activa.');
    }

    // 2. Buscar el plan asociado para obtener el Stripe Price ID
    const plan = await this.plansRepository.findById(subscription.planId);
    if (!plan || !plan.stripePriceId) {
      throw new BadRequestException('El plan seleccionado no tiene configurada una pasarela de pago válida.');
    }

    // 3. Obtener URLs de retorno desde la configuración
    const successUrl = this.configService.getOrThrow<string>('STRIPE_SUCCESS_URL');
    const cancelUrl = this.configService.getOrThrow<string>('STRIPE_CANCEL_URL');

    // 4. Obtener datos del usuario para Stripe (Requerido para Accounts V2 en TestMode)
    const user = await this.usersRepository.getUserDetails(subscription.userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado para la suscripción.');
    }

    // 5. Asegurar cliente en Stripe
    const stripeCustomerId = await this.stripeService.getOrCreateCustomer(user.email, user.name);

    // 6. Crear la sesión en Stripe
    try {
      const session = await this.stripeService.createCheckoutSession({
        priceId: plan.stripePriceId,
        subscriptionId: subscription.id,
        customerId: stripeCustomerId,
        successUrl: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&subscription_id=${subscription.id}`,
        cancelUrl: cancelUrl,
        metadata: {
          userId: subscription.userId,
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
      throw new BadRequestException(`Error al generar la sesión de pago: ${error.message}`);
    }
  }
}
