import { Injectable, Inject, Logger } from '@nestjs/common';
import type { IWalletRepository } from './interfaces/wallet.repository.interface';
import { WALLET_REPOSITORY_TOKEN } from './interfaces/wallet.repository.interface';
import type { ISignatureValidator } from './interfaces/signature.validator.interface';
import { STRIPE_VALIDATOR_TOKEN } from './interfaces/signature.validator.interface';
import {
  StripeWebhookPayload,
  WebhookResponse,
  InvalidSignatureError,
} from './webhooks-top-up.models';

@Injectable()
export class StripeWebhookHandler {
  private readonly logger = new Logger(StripeWebhookHandler.name);

  constructor(
    @Inject(WALLET_REPOSITORY_TOKEN)
    private readonly walletRepository: IWalletRepository,
    @Inject(STRIPE_VALIDATOR_TOKEN)
    private readonly signatureValidator: ISignatureValidator,
  ) {}

  public async execute(
    payload: any,
    signature: string,
  ): Promise<WebhookResponse> {
    
    if (signature !== 'VALIDATED_BY_DISPATCHER') {
      const isValid = this.signatureValidator.validateSignature(payload, signature);
      if (!isValid) {
        throw new InvalidSignatureError();
      }
    }

    
    const data: StripeWebhookPayload = Buffer.isBuffer(payload) 
      ? JSON.parse(payload.toString('utf-8')) 
      : (typeof payload === 'string' ? JSON.parse(payload) : payload);

    
    if (
      data.type === 'checkout.session.completed' &&
      data.data.object.status === 'complete'
    ) {
      const metadata = data.data.object.metadata || {};
      const userId = metadata.userId;
      const amount = parseInt(metadata.coinsAmount, 10);
      const transactionId = data.id;

      if (!userId || isNaN(amount)) {
        this.logger.warn(`Evento ${data.id} no contiene metadata suficiente para recarga: userId=${userId}, amount=${amount}`);
        return { success: false, message: 'Metadata insuficiente' };
      }

      this.logger.log(`Acreditando ${amount} Panter Coins al usuario ${userId} [Evento: ${transactionId}]`);

      await this.walletRepository.creditCoinsToUser(
        userId,
        amount,
        transactionId,
      );
    }

    return { success: true, message: 'Stripe Webhook (Wallet) procesado exitosamente' };
  }
}
