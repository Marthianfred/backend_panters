import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import Stripe from 'stripe';
import * as userSubscriptionsInterface from '@/features/subscriptions/interfaces/user.subscriptions.repository.interface';
import * as subscriptionPlansInterface from '@/features/subscriptions/interfaces/subscription.plans.repository.interface';

@Injectable()
export class HandleStripeWebhookUseCase {
  private readonly logger = new Logger(HandleStripeWebhookUseCase.name);

  constructor(
    @Inject(userSubscriptionsInterface.USER_SUBSCRIPTIONS_REPOSITORY)
    private readonly userSubscriptionsRepository: userSubscriptionsInterface.IUserSubscriptionsRepository,
    @Inject(subscriptionPlansInterface.SUBSCRIPTION_PLANS_REPOSITORY)
    private readonly plansRepository: subscriptionPlansInterface.ISubscriptionPlansRepository,
  ) {}

  async execute(event: Stripe.Event): Promise<void> {
    this.logger.log(
      `Procesando evento de Stripe en Subscriptions: ${event.type} [${event.id}]`,
    );

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;

      default:
        this.logger.warn(
          `Evento de Stripe no manejado en Subscriptions: ${event.type}`,
        );
    }
  }

  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    const metadata = session.metadata;
    const subscriptionId = metadata?.subscriptionId;
    const action = metadata?.action;

    if (!subscriptionId) {
      this.logger.error('Sesión de Checkout sin metadata de subscriptionId');
      return;
    }

    const externalId = session.subscription as string;

    if (action === 'renew') {
      await this.processRenewal(subscriptionId);
      return;
    }

    if (action === 'upgrade') {
      const targetPlanId = metadata?.targetPlanId;
      await this.processUpgrade(subscriptionId, targetPlanId);
      return;
    }

    this.logger.log(
      `Pago inicial confirmado para suscripción: ${subscriptionId}. Activando...`,
    );

    try {
      await this.userSubscriptionsRepository.updateStatus(
        subscriptionId,
        'active',
        externalId,
      );
      this.logger.log(`Suscripción ${subscriptionId} activada con éxito.`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(
        `Error activando suscripción ${subscriptionId}: ${message}`,
      );
      throw new BadRequestException(
        'Error al procesar la activación de la suscripción.',
      );
    }
  }

  private async processRenewal(subscriptionId: string): Promise<void> {
    this.logger.log(
      `Procesando renovación manual para suscripción: ${subscriptionId}`,
    );

    const subscription =
      await this.userSubscriptionsRepository.findById(subscriptionId);
    if (!subscription) {
      this.logger.error(
        `Suscripción ${subscriptionId} no encontrada para renovación.`,
      );
      return;
    }

    const plan = await this.plansRepository.findById(subscription.planId);
    if (!plan) {
      this.logger.error(
        `Plan ${subscription.planId} no encontrado para la suscripción ${subscriptionId}.`,
      );
      return;
    }

    const now = new Date();
    const currentEndsAt = subscription.endsAt
      ? new Date(subscription.endsAt)
      : now;
    const baseDate = currentEndsAt > now ? currentEndsAt : now;

    const newEndsAt = new Date(
      baseDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000,
    );
    const newStartsAt = subscription.startsAt || now;

    try {
      await this.userSubscriptionsRepository.updatePeriod(
        subscriptionId,
        newStartsAt,
        newEndsAt,
      );
      this.logger.log(
        `Suscripción ${subscriptionId} renovada exitosamente hasta ${newEndsAt.toISOString()}`,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(
        `Error al actualizar el periodo de renovación para ${subscriptionId}: ${message}`,
      );
      throw new BadRequestException(
        'Error al procesar la renovación en la base de datos.',
      );
    }
  }

  private async processUpgrade(
    subscriptionId: string,
    targetPlanId: string,
  ): Promise<void> {
    this.logger.log(
      `Procesando upgrade para suscripción: ${subscriptionId} al plan: ${targetPlanId}`,
    );

    if (!targetPlanId) {
      this.logger.error(
        `Upgrade fallido: targetPlanId no proporcionado para ${subscriptionId}`,
      );
      return;
    }

    const plan = await this.plansRepository.findById(targetPlanId);
    if (!plan) {
      this.logger.error(`Plan objetivo ${targetPlanId} no encontrado.`);
      return;
    }

    const now = new Date();
    const newEndsAt = new Date(
      now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000,
    );

    try {
      await this.userSubscriptionsRepository.changePlan(
        subscriptionId,
        targetPlanId,
        now,
        newEndsAt,
      );
      this.logger.log(
        `Suscripción ${subscriptionId} mejorada con éxito al plan ${plan.name} hasta ${newEndsAt.toISOString()}`,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(
        `Error al procesar el upgrade para ${subscriptionId}: ${message}`,
      );
      throw new BadRequestException(
        'Error al actualizar el plan en la base de datos.',
      );
    }
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const externalSubscriptionId = (
      invoice as unknown as { subscription: string }
    ).subscription;

    if (!externalSubscriptionId) {
      this.logger.warn(
        `Factura pagada ${invoice.id} no tiene ID de suscripción asociado.`,
      );
      return;
    }

    const subscription =
      await this.userSubscriptionsRepository.findByExternalId(
        externalSubscriptionId,
      );

    if (!subscription) {
      this.logger.error(
        `No se encontró suscripción local para el ID externo de Stripe: ${externalSubscriptionId}`,
      );
      return;
    }

    const periodStart = new Date(invoice.period_start * 1000);
    const periodEnd = new Date(invoice.period_end * 1000);

    this.logger.log(
      `Renovando suscripción ${subscription.id} hasta ${periodEnd.toISOString()}`,
    );

    try {
      await this.userSubscriptionsRepository.updatePeriod(
        subscription.id,
        periodStart,
        periodEnd,
      );
      this.logger.log(`Suscripción ${subscription.id} renovada con éxito.`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(
        `Error renovando suscripción ${subscription.id}: ${message}`,
      );
      throw new BadRequestException(
        'Error al procesar la renovación de la suscripción.',
      );
    }
  }

  private async handleSubscriptionDeleted(
    stripeSubscription: Stripe.Subscription,
  ): Promise<void> {
    const externalId = stripeSubscription.id;

    const subscription =
      await this.userSubscriptionsRepository.findByExternalId(externalId);

    if (!subscription) {
      this.logger.warn(
        `Cancelación recibida para suscripción externa desconocida: ${externalId}`,
      );
      return;
    }

    this.logger.log(
      `Cancelando suscripción local ${subscription.id} debido a evento externo.`,
    );

    try {
      await this.userSubscriptionsRepository.updateStatus(
        subscription.id,
        'cancelled',
      );
      this.logger.log(`Suscripción ${subscription.id} marcada como cancelada.`);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(
        `Error cancelando suscripción ${subscription.id}: ${message}`,
      );
    }
  }
}
