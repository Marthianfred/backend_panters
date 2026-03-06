import { Injectable, Inject } from '@nestjs/common';
import type { IWalletRepository } from './interfaces/wallet.repository.interface';
import { WALLET_REPOSITORY_TOKEN } from './interfaces/wallet.repository.interface';
import type { ISignatureValidator } from './interfaces/signature.validator.interface';
import { BINANCE_VALIDATOR_TOKEN } from './interfaces/signature.validator.interface';
import type {
  BinanceWebhookPayload,
  WebhookResponse,
} from './webhooks-top-up.models';
import { InvalidSignatureError } from './webhooks-top-up.models';

@Injectable()
export class BinanceWebhookHandler {
  constructor(
    @Inject(WALLET_REPOSITORY_TOKEN)
    private readonly walletRepository: IWalletRepository,
    @Inject(BINANCE_VALIDATOR_TOKEN)
    private readonly signatureValidator: ISignatureValidator,
  ) {}

  public async execute(
    payload: BinanceWebhookPayload,
    signature: string,
  ): Promise<WebhookResponse> {
    const isValid = this.signatureValidator.validateSignature(
      payload,
      signature,
    );

    if (!isValid) {
      throw new InvalidSignatureError();
    }

    if (payload.bizStatus === 'PAY_SUCCESS') {
      const userId = payload.metadata.userId;
      const amount = parseInt(payload.metadata.coinsAmount, 10);
      const transactionId = payload.bizId;

      await this.walletRepository.creditCoinsToUser(
        userId,
        amount,
        transactionId,
      );
    }

    return {
      success: true,
      message: 'Binance Webhook procesado exitosamente',
    };
  }
}
