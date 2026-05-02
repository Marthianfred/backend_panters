import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionPlansManagementController } from './subscription-plans-management.controller';
import { CreatePlanHandler } from './application/create-plan/create-plan.handler';
import { UpdatePlanHandler } from './application/update-plan/update-plan.handler';
import { ActivatePlanHandler } from './application/activate-plan/activate-plan.handler';
import { DeactivatePlanHandler } from './application/deactivate-plan/deactivate-plan.handler';
import { ListPlansHandler } from './application/list-plans/list-plans.handler';
import { SUBSCRIPTION_PLAN_REPOSITORY } from './domain/subscription-plan.repository.interface';
import { PostgresSubscriptionPlanRepository } from './infrastructure/postgres-subscription-plan.repository';

@Module({
  imports: [ConfigModule],
  controllers: [SubscriptionPlansManagementController],
  providers: [
    CreatePlanHandler,
    UpdatePlanHandler,
    ActivatePlanHandler,
    DeactivatePlanHandler,
    ListPlansHandler,
    {
      provide: SUBSCRIPTION_PLAN_REPOSITORY,
      useClass: PostgresSubscriptionPlanRepository,
    },
  ],
  exports: [SUBSCRIPTION_PLAN_REPOSITORY],
})
export class SubscriptionPlansManagementModule {}
