import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import * as userSubscriptionsInterface from '@/features/subscriptions/interfaces/user.subscriptions.repository.interface';

@Injectable()
export class HandleStripeWebhookUseCase {
  private readonly logger = new Logger(HandleStripeWebhookUseCase.name);

  constructor(
    @Inject(userSubscriptionsInterface.USER_SUBSCRIPTIONS_REPOSITORY)
    private readonly userSubscriptionsRepository: userSubscriptionsInterface.IUserSubscriptionsRepository,
  ) {}

  async execute(event: Stripe.Event): Promise<void> {
    this.logger.log(`Procesando evento de Stripe en Subscriptions: ${event.type} [${event.id}]`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      default:
        this.logger.warn(`Evento de Stripe no manejado en Subscriptions: ${event.type}`);
    }
  }

  
  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const metadata = session.metadata;
    const subscriptionId = metadata?.subscriptionId;
    
    if (!subscriptionId) {
      this.logger.error('Sesión de Checkout sin metadata de subscriptionId');
      return;
    }

    const externalId = session.subscription as string;

    this.logger.log(`Pago inicial confirmado para suscripción: ${subscriptionId}. Activando...`);

    try {
      await this.userSubscriptionsRepository.updateStatus(
        subscriptionId,
        'active',
        externalId
      );
      this.logger.log(`Suscripción ${subscriptionId} activada con éxito.`);
    } catch (error) {
      this.logger.error(`Error activando suscripción ${subscriptionId}: ${error.message}`);
      throw new BadRequestException('Error al procesar la activación de la suscripción.');
    }
  }

  
  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const externalSubscriptionId = (invoice as any).subscription as string;
    
    if (!externalSubscriptionId) {
      this.logger.warn(`Factura pagada ${invoice.id} no tiene ID de suscripción asociado.`);
      return;
    }

    
    const subscription = await this.userSubscriptionsRepository.findByExternalId(externalSubscriptionId);
    
    if (!subscription) {
      this.logger.error(`No se encontró suscripción local para el ID externo de Stripe: ${externalSubscriptionId}`);
      return;
    }

    
    
    const periodStart = new Date(invoice.period_start * 1000);
    const periodEnd = new Date(invoice.period_end * 1000);

    this.logger.log(`Renovando suscripción ${subscription.id} hasta ${periodEnd.toISOString()}`);

    try {
      await this.userSubscriptionsRepository.updatePeriod(
        subscription.id,
        periodStart,
        periodEnd
      );
      this.logger.log(`Suscripción ${subscription.id} renovada con éxito.`);
    } catch (error) {
      this.logger.error(`Error renovando suscripción ${subscription.id}: ${error.message}`);
      throw new BadRequestException('Error al procesar la renovación de la suscripción.');
    }
  }

  
  private async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {
    const externalId = stripeSubscription.id;
    
    const subscription = await this.userSubscriptionsRepository.findByExternalId(externalId);
    
    if (!subscription) {
      this.logger.warn(`Cancelación recibida para suscripción externa desconocida: ${externalId}`);
      return;
    }

    this.logger.log(`Cancelando suscripción local ${subscription.id} debido a evento externo.`);

    try {
      await this.userSubscriptionsRepository.updateStatus(subscription.id, 'canceled');
      this.logger.log(`Suscripción ${subscription.id} marcada como cancelada.`);
    } catch (error) {
      this.logger.error(`Error cancelando suscripción ${subscription.id}: ${error.message}`);
    }
  }
}
