import { Injectable } from '@nestjs/common';
import { ISignatureValidator } from '../interfaces/signature.validator.interface';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeSignatureValidator implements ISignatureValidator {
  private stripe: Stripe | null = null;

  constructor(private readonly config: ConfigService) {
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');
    if (secretKey && secretKey !== 'sk_test_...') {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2025-01-27' as any,
      });
    } else {
      console.warn('[StripeSignatureValidator] Stripe key missing or placeholder. Signature validation will be disabled.');
    }
  }

  public validateSignature(payload: any, signature: string): boolean {
    const endpointSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!endpointSecret) {
      console.warn('[StripeSignatureValidator] No endpoint secret configured, skipping validation (DANGEROUS)');
      return true;
    }

    try {
      if (!this.stripe) {
        console.error('[StripeSignatureValidator] Stripe was not initialized. Check your STRIPE_SECRET_KEY.');
        return false;
      }
      
      // payload must be the raw body (Buffer)
      this.stripe.webhooks.constructEvent(payload, signature, endpointSecret);
      return true;
    } catch (err) {
      console.error(`[Stripe] Error validando firma del webhook: ${err.message}`);
      return false;
    }
  }
}

import * as crypto from 'crypto';

@Injectable()
export class BinanceSignatureValidator implements ISignatureValidator {
  constructor(private readonly config: ConfigService) {}

  public validateSignature(payload: any, signature: string): boolean {
    const binancePublicKey = this.config.get<string>('BINANCE_PAY_PUBLIC_KEY');
    if (!binancePublicKey) {
      console.warn('[BinanceSignatureValidator] No public key configured, skipping validation (DANGEROUS)');
      return true;
    }

    try {
      // payload must be the raw body (string) for binance verification
      const bodyString = Buffer.isBuffer(payload) ? payload.toString('utf-8') : payload;
      
      const verifier = crypto.createVerify('SHA256');
      verifier.update(bodyString);
      verifier.end();

      return verifier.verify(binancePublicKey, signature, 'base64');
    } catch (err) {
      console.error(`[Binance] Error validando firma del webhook: ${err.message}`);
      return false;
    }
  }
}
