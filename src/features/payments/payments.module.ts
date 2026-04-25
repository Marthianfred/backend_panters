import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripeService } from '@/core/infrastructure/stripe/stripe.service';
import { StripeEventRepository } from '@/core/infrastructure/stripe/stripe-event.repository';
import { StripeWebhookController } from './webhooks/infrastructure/stripe-webhook.controller';
import { HandleUnifiedStripeWebhookUseCase } from './webhooks/application/handle-stripe-webhook.use-case';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { WalletModule } from '../wallet/wallet.module';

@Global()
@Module({
  imports: [
    ConfigModule,
    // Importamos los módulos que contienen los handlers específicos
    SubscriptionsModule,
    WalletModule,
  ],
  controllers: [StripeWebhookController],
  providers: [
    StripeService,
    StripeEventRepository,
    HandleUnifiedStripeWebhookUseCase,
  ],
  exports: [StripeService, StripeEventRepository],
})
export class PaymentsModule {}
