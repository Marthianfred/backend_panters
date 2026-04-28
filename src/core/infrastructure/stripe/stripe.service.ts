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
      apiVersion: '2025-01-27.acacia' as any,
    });
  }

  
  constructEvent(payload: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.configService.getOrThrow<string>('STRIPE_WEBHOOK_SECRET');
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      this.logger.error(`Error verificando firma de Stripe: ${err.message}`);
      throw err;
    }
  }

  
  async getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.retrieve(sessionId);
  }

  
  async createCheckoutSession(params: {
    customerId?: string;
    customerEmail?: string;
    priceId: string;
    subscriptionId?: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
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
        type: 'subscription',
        ...(params.subscriptionId ? { subscriptionId: params.subscriptionId } : {}),
        ...params.metadata,
      },
    });
  }

  
  async getOrCreateCustomer(email: string, name?: string): Promise<string> {
    const customers = await this.stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      return customers.data[0].id;
    }

    const customer = await this.stripe.customers.create({
      email: email,
      name: name,
    });

    return customer.id;
  }

  
  async createWalletTopUpSession(params: {
    userId: string;
    coinsAmount: number;
    amountInCents: number;
    successUrl: string;
    cancelUrl: string;
  }): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${params.coinsAmount} Panter Coins`,
            },
            unit_amount: params.amountInCents,
          },
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        userId: params.userId,
        coinsAmount: params.coinsAmount.toString(),
        type: 'wallet_top_up',
      },
    });
  }
}
