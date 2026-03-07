import { Injectable } from '@nestjs/common';
import { ISignatureValidator } from '../interfaces/signature.validator.interface';

@Injectable()
export class StripeSignatureValidator implements ISignatureValidator {
  public validateSignature(payload: unknown, signature: string): boolean {
    // Aquí integraremos el Stripe SDK con process.env.STRIPE_WEBHOOK_SECRET en el futuro
    if (!signature || signature.trim() === '') {
      return false;
    }
    return true;
  }
}

@Injectable()
export class BinanceSignatureValidator implements ISignatureValidator {
  public validateSignature(payload: unknown, signature: string): boolean {
    // Aquí integraremos crypto para validar contra public key de Binance Pay en el futuro
    if (!signature || signature.trim() === '') {
      return false;
    }
    return true;
  }
}
