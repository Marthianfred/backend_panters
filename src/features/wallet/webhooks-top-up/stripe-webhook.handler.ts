import { Injectable, Inject } from '@nestjs/common';
import type { IWalletRepository } from './interfaces/wallet.repository.interface';
import { WALLET_REPOSITORY_TOKEN } from './interfaces/wallet.repository.interface';
import type { ISignatureValidator } from './interfaces/signature.validator.interface';
import { STRIPE_VALIDATOR_TOKEN } from './interfaces/signature.validator.interface';
import type {
  StripeWebhookPayload,
  WebhookResponse,
} from './webhooks-top-up.models';
import { InvalidSignatureError } from './webhooks-top-up.models';

@Injectable()
export class StripeWebhookHandler {
  constructor(
    @Inject(WALLET_REPOSITORY_TOKEN)
    private readonly walletRepository: IWalletRepository,
    @Inject(STRIPE_VALIDATOR_TOKEN)
    private readonly signatureValidator: ISignatureValidator,
  ) {}

  public async execute(
    payload: StripeWebhookPayload,
    signature: string,
  ): Promise<WebhookResponse> {
    const isValid = this.signatureValidator.validateSignature(
      payload,
      signature,
    );

    if (!isValid) {
      throw new InvalidSignatureError();
    }

    if (
      payload.type === 'checkout.session.completed' &&
      payload.data.object.status === 'complete'
    ) {
      const userId = payload.data.object.metadata.userId;
      const amount = parseInt(payload.data.object.metadata.coinsAmount, 10);
      const transactionId = payload.id;

      await this.walletRepository.creditCoinsToUser(
        userId,
        amount,
        transactionId,
      );
    }

    return { success: true, message: 'Stripe Webhook procesado exitosamente' };
  }
}
