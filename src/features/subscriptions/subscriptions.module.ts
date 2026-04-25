import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../core/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { PlansController } from './plans/plans.controller';
import { ListPlansHandler } from './plans/list-plans.handler';
import { CreatePlanHandler } from './plans/create-plan.handler';
import { GetPlanHandler } from './plans/get-plan.handler';
import { UpdatePlanHandler } from './plans/update-plan.handler';
import { DeletePlanHandler } from './plans/delete-plan.handler';
import { SUBSCRIPTION_PLANS_REPOSITORY } from './interfaces/subscription.plans.repository.interface';
import { PostgresSubscriptionPlansRepository } from './infrastructure/postgres.subscription-plans.repository';

// Pre-registration Slice
import { PreRegistrationController } from './pre-registration/infrastructure/pre-registration.controller';
import { PreRegistrationUseCase } from './pre-registration/application/pre-registration.use-case';
import { USER_SUBSCRIPTIONS_REPOSITORY } from './interfaces/user.subscriptions.repository.interface';
import { PostgresUserSubscriptionsRepository } from './infrastructure/postgres.user-subscriptions.repository';

// Webhooks
import { HandleStripeWebhookUseCase } from './webhooks/stripe/application/handle-stripe-webhook.use-case';

// Checkout Slice
import { CheckoutController } from './checkout/infrastructure/checkout.controller';
import { CreateCheckoutSessionUseCase } from './checkout/application/create-checkout-session.use-case';

// Guards
import { SubscriptionGuard } from './guards/subscription.guard';

@Module({
  imports: [ConfigModule, DatabaseModule, AuthModule],
  controllers: [
    PlansController, 
    PreRegistrationController, 
    CheckoutController
  ],
  providers: [
    ListPlansHandler,
    CreatePlanHandler,
    GetPlanHandler,
    UpdatePlanHandler,
    DeletePlanHandler,
    PreRegistrationUseCase,
    HandleStripeWebhookUseCase,
    CreateCheckoutSessionUseCase,
    SubscriptionGuard,
    {
      provide: SUBSCRIPTION_PLANS_REPOSITORY,
      useClass: PostgresSubscriptionPlansRepository,
    },
    {
      provide: USER_SUBSCRIPTIONS_REPOSITORY,
      useClass: PostgresUserSubscriptionsRepository,
    },
  ],
  exports: [
    SUBSCRIPTION_PLANS_REPOSITORY, 
    USER_SUBSCRIPTIONS_REPOSITORY,
    HandleStripeWebhookUseCase, // Exportado para ser usado por el dispatcher unificado
    CreateCheckoutSessionUseCase
  ],
})
export class SubscriptionsModule {}
