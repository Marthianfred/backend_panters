import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../core/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { UsersManagementModule } from '../users/management/users-management.module';
import { PlansController } from './plans/plans.controller';
import { ListPlansHandler } from './plans/list-plans.handler';
import { CreatePlanHandler } from './plans/create-plan.handler';
import { GetPlanHandler } from './plans/get-plan.handler';
import { UpdatePlanHandler } from './plans/update-plan.handler';
import { DeletePlanHandler } from './plans/delete-plan.handler';
import { SUBSCRIPTION_PLANS_REPOSITORY } from './interfaces/subscription.plans.repository.interface';
import { PostgresSubscriptionPlansRepository } from './infrastructure/postgres.subscription-plans.repository';


import { PreRegistrationController } from './pre-registration/infrastructure/pre-registration.controller';
import { PreRegistrationUseCase } from './pre-registration/application/pre-registration.use-case';
import { USER_SUBSCRIPTIONS_REPOSITORY } from './interfaces/user.subscriptions.repository.interface';
import { PostgresUserSubscriptionsRepository } from './infrastructure/postgres.user-subscriptions.repository';


import { HandleStripeWebhookUseCase } from './webhooks/stripe/application/handle-stripe-webhook.use-case';


import { CheckoutController } from './checkout/infrastructure/checkout.controller';
import { CreateCheckoutSessionUseCase } from './checkout/application/create-checkout-session.use-case';


import { RenewSubscriptionController } from './renew/infrastructure/renew-subscription.controller';
import { RenewSubscriptionUseCase } from './renew/application/renew-subscription.use-case';


import { UpgradeSubscriptionController } from './upgrade-subscription/infrastructure/upgrade-subscription.controller';
import { UpgradeSubscriptionUseCase } from './upgrade-subscription/application/upgrade-subscription.use-case';


import { GetSubscriptionStatusController } from './get-status/infrastructure/get-subscription-status.controller';
import { GetSubscriptionStatusUseCase } from './get-status/application/get-subscription-status.use-case';


import { GetMySubscriptionController } from './get-my-subscription/infrastructure/get-my-subscription.controller';
import { GetMySubscriptionUseCase } from './get-my-subscription/application/get-my-subscription.use-case';


import { SubscriptionGuard } from './guards/subscription.guard';
import { CheckExpiredSubscriptionsTask } from './check-expired/application/check-expired-subscriptions.task';


@Module({
  imports: [ConfigModule, DatabaseModule, AuthModule, UsersManagementModule],
  controllers: [
    PlansController, 
    PreRegistrationController, 
    CheckoutController,
    RenewSubscriptionController,
    UpgradeSubscriptionController,
    GetMySubscriptionController,
    GetSubscriptionStatusController
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
    RenewSubscriptionUseCase,
    UpgradeSubscriptionUseCase,
    GetMySubscriptionUseCase,
    GetSubscriptionStatusUseCase,
    SubscriptionGuard,
    CheckExpiredSubscriptionsTask,
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
    HandleStripeWebhookUseCase, 
    CreateCheckoutSessionUseCase,
    RenewSubscriptionUseCase,
    UpgradeSubscriptionUseCase,
    GetMySubscriptionUseCase,
    CheckExpiredSubscriptionsTask
  ],


})
export class SubscriptionsModule {}

