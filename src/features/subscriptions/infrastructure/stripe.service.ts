import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.getOrThrow<string>('STRIPE_SECRET_KEY');
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-01-27.acacia' as any, // Ajustado a la versión más reciente compatible
    });
  }

  /**
   * Construye un evento de Stripe validando la firma del webhook.
   */
  constructEvent(payload: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.configService.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      this.logger.error(`Error verificando firma de Stripe: ${err.message}`);
      throw err;
    }
  }

  /**
   * Obtiene una sesión de checkout por su ID.
   */
  async getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.retrieve(sessionId);
  }

  /**
   * Obtiene los metadatos de una sesión.
   */
  getMetadata(session: Stripe.Checkout.Session): Record<string, string> {
    return (session.metadata as Record<string, string>) || {};
  }

  /**
   * Crea una sesión de Checkout para una suscripción.
   */
  async createCheckoutSession(params: {
    customerId?: string;
    customerEmail?: string;
    priceId: string;
    subscriptionId: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: params.customerId,
      customer_email: params.customerId ? undefined : params.customerEmail,
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        subscriptionId: params.subscriptionId,
        ...params.metadata,
      },
    });
  }
}
