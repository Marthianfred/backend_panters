import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StripeService } from '@/core/infrastructure/stripe/stripe.service';
import { StripeEventRepository } from '@/core/infrastructure/stripe/stripe-event.repository';
import { StripeWebhookController } from './webhooks/infrastructure/stripe-webhook.controller';
import { HandleUnifiedStripeWebhookUseCase } from './webhooks/application/handle-stripe-webhook.use-case';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { WalletModule } from '../wallet/wallet.module';
import { PurchasePtcModule } from './purchase-ptc/purchase-ptc.module';

@Global()
@Module({
  imports: [
    ConfigModule,
    
    SubscriptionsModule,
    WalletModule,
    PurchasePtcModule,
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
