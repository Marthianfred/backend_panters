import { Injectable, Logger, Inject } from '@nestjs/common';
import Stripe from 'stripe';
import { StripeEventRepository } from '@/core/infrastructure/stripe/stripe-event.repository';
import { HandleStripeWebhookUseCase as SubscriptionWebhookUseCase } from '@/features/subscriptions/webhooks/stripe/application/handle-stripe-webhook.use-case';
import { StripeWebhookHandler as WalletWebhookHandler } from '@/features/wallet/webhooks-top-up/stripe-webhook.handler';

@Injectable()
export class HandleUnifiedStripeWebhookUseCase {
  private readonly logger = new Logger(HandleUnifiedStripeWebhookUseCase.name);

  constructor(
    private readonly stripeEventRepository: StripeEventRepository,
    private readonly subscriptionWebhookUseCase: SubscriptionWebhookUseCase,
    private readonly walletWebhookHandler: WalletWebhookHandler,
  ) {}

  async execute(event: Stripe.Event): Promise<void> {
    const eventId = event.id;
    
    
    const existingEvent = await this.stripeEventRepository.findById(eventId);
    if (existingEvent && existingEvent.status === 'completed') {
      this.logger.warn(`Evento de Stripe ${eventId} ya fue procesado anteriormente.`);
      return;
    }

    if (existingEvent && existingEvent.status === 'processing') {
      this.logger.warn(`Evento de Stripe ${eventId} está siendo procesado actualmente.`);
      return;
    }

    
    await this.stripeEventRepository.recordProcessing(eventId, event.type, event.data.object['metadata']);

    try {
      this.logger.log(`Iniciando despacho de evento: ${event.type} [${eventId}]`);

      
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, eventId);
          break;
        
        case 'invoice.paid':
        case 'customer.subscription.deleted':
        case 'customer.subscription.updated':
          
          await this.subscriptionWebhookUseCase.execute(event);
          break;
        
        default:
          this.logger.warn(`Evento de Stripe no manejado por el despachador unificado: ${event.type}`);
      }

      
      await this.stripeEventRepository.markAsCompleted(eventId);
      this.logger.log(`Evento ${eventId} procesado y marcado como completado.`);
    } catch (error) {
      this.logger.error(`Error procesando evento ${eventId}: ${error.message}`);
      await this.stripeEventRepository.markAsFailed(eventId);
      throw error;
    }
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, originalEventId: string): Promise<void> {
    const metadata = session.metadata || {};
    const type = metadata.type;

    
    if (type === 'wallet_top_up' || type === 'ptc_purchase' || metadata.coinsAmount) {
      this.logger.log('Delegando checkout a la vertical de Wallet...');
      const event: any = { id: originalEventId, type: 'checkout.session.completed', data: { object: session } };
      await this.walletWebhookHandler.execute(event, 'VALIDATED_BY_DISPATCHER');
    }
    
    else if (type === 'subscription' || metadata.subscriptionId) {
      this.logger.log('Delegando checkout a la vertical de Suscripciones...');
      const event: any = { id: originalEventId, type: 'checkout.session.completed', data: { object: session } };
      await this.subscriptionWebhookUseCase.execute(event);
    }
    else {
      this.logger.warn('Evento checkout.session.completed sin tipo definido en metadata. No se puede enrutar.');
    }
  }
}
