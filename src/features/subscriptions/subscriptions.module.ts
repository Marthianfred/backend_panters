import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../core/database/database.module';
import { PlansController } from './plans/plans.controller';
import { ListPlansHandler } from './plans/list-plans.handler';
import { CreatePlanHandler } from './plans/create-plan.handler';
import { GetPlanHandler } from './plans/get-plan.handler';
import { UpdatePlanHandler } from './plans/update-plan.handler';
import { DeletePlanHandler } from './plans/delete-plan.handler';
import { SUBSCRIPTION_PLANS_REPOSITORY } from './interfaces/subscription.plans.repository.interface';
import { PostgresSubscriptionPlansRepository } from './infrastructure/postgres.subscription-plans.repository';

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [PlansController],
  providers: [
    ListPlansHandler,
    CreatePlanHandler,
    GetPlanHandler,
    UpdatePlanHandler,
    DeletePlanHandler,
    {
      provide: SUBSCRIPTION_PLANS_REPOSITORY,
      useClass: PostgresSubscriptionPlansRepository,
    },
  ],
  exports: [SUBSCRIPTION_PLANS_REPOSITORY],
})
export class SubscriptionsModule {}
