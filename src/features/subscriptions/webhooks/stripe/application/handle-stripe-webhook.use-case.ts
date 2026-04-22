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
    this.logger.log(`Procesando evento de Stripe: ${event.type} [${event.id}]`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      // Se pueden agregar más casos según sea necesario (invoice.payment_failed, etc.)
      default:
        this.logger.warn(`Evento de Stripe no manejado: ${event.type}`);
    }
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const metadata = session.metadata;
    
    if (!metadata || !metadata.subscriptionId) {
      this.logger.error('Sesión de Stripe sin metadata de subscriptionId');
      return;
    }

    const subscriptionId = metadata.subscriptionId;
    const externalId = session.subscription as string; // El ID de suscripción en Stripe

    this.logger.log(`Pago confirmado para suscripción: ${subscriptionId}. Activando...`);

    try {
      await this.userSubscriptionsRepository.updateStatus(
        subscriptionId,
        'active',
        externalId
      );
      this.logger.log(`Suscripción ${subscriptionId} activada con éxito.`);
    } catch (error) {
      this.logger.error(`Error actualizando estado de suscripción ${subscriptionId}: ${error.message}`);
      throw new BadRequestException('Error al procesar la actualización de la suscripción.');
    }
  }
}
