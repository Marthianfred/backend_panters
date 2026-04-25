import { Module } from '@nestjs/common';
import { WebhooksTopUpController } from './webhooks-top-up.controller';
import { StripeWebhookHandler } from './stripe-webhook.handler';
import { BinanceWebhookHandler } from './binance-webhook.handler';
import { WALLET_REPOSITORY_TOKEN } from './interfaces/wallet.repository.interface';
import {
  STRIPE_VALIDATOR_TOKEN,
  BINANCE_VALIDATOR_TOKEN,
} from './interfaces/signature.validator.interface';
import { PostgresTopUpWalletRepository } from './infrastructure/postgres.topup-wallet.repository';
import {
  StripeSignatureValidator,
  BinanceSignatureValidator,
} from './infrastructure/signature.validators';

@Module({
  controllers: [WebhooksTopUpController],
  providers: [
    StripeWebhookHandler,
    BinanceWebhookHandler,
    {
      provide: WALLET_REPOSITORY_TOKEN,
      useClass: PostgresTopUpWalletRepository,
    },
    {
      provide: STRIPE_VALIDATOR_TOKEN,
      useClass: StripeSignatureValidator,
    },
    {
      provide: BINANCE_VALIDATOR_TOKEN,
      useClass: BinanceSignatureValidator,
    },
  ],
  exports: [StripeWebhookHandler], // Exportado para el dispatcher unificado
})
export class WebhooksTopUpModule {}
