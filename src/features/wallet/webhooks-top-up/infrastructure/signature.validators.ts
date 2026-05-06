import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { ISignatureValidator } from '../interfaces/signature.validator.interface';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeSignatureValidator implements ISignatureValidator {
  private stripe: Stripe | null = null;

  constructor(private readonly config: ConfigService) {
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');
    if (secretKey && secretKey !== 'sk_test_...') {
      this.stripe = new Stripe(secretKey);
    } else {
      console.warn(
        '[StripeSignatureValidator] Stripe key missing or placeholder. Signature validation will be disabled.',
      );
    }
  }

  public validateSignature(
    payload: Buffer | string | Record<string, unknown>,
    signature: string,
  ): boolean {
    const endpointSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!endpointSecret) {
      console.warn(
        '[StripeSignatureValidator] No endpoint secret configured, skipping validation (DANGEROUS)',
      );
      return true;
    }

    try {
      if (!this.stripe) {
        console.error(
          '[StripeSignatureValidator] Stripe was not initialized. Check your STRIPE_SECRET_KEY.',
        );
        return false;
      }

      this.stripe.webhooks.constructEvent(
        payload as string | Buffer,
        signature,
        endpointSecret,
      );
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error(`[Stripe] Error validando firma del webhook: ${message}`);
      return false;
    }
  }
}

@Injectable()
export class BinanceSignatureValidator implements ISignatureValidator {
  constructor(private readonly config: ConfigService) {}

  public validateSignature(
    payload: Buffer | string | Record<string, unknown>,
    signature: string,
  ): boolean {
    const binancePublicKey = this.config.get<string>('BINANCE_PAY_PUBLIC_KEY');
    if (!binancePublicKey) {
      console.warn(
        '[BinanceSignatureValidator] No public key configured, skipping validation (DANGEROUS)',
      );
      return true;
    }

    try {
      const bodyString = Buffer.isBuffer(payload)
        ? payload.toString('utf-8')
        : (payload as string);

      const verifier = crypto.createVerify('SHA256');
      verifier.update(bodyString);
      verifier.end();

      return verifier.verify(binancePublicKey, signature, 'base64');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error(`[Binance] Error validando firma del webhook: ${message}`);
      return false;
    }
  }
}
