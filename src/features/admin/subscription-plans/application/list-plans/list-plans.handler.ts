import { Injectable, Inject } from '@nestjs/common';
import { SUBSCRIPTION_PLAN_REPOSITORY } from '../../domain/subscription-plan.repository.interface';
import type { ISubscriptionPlanRepository } from '../../domain/subscription-plan.repository.interface';
import { SubscriptionPlanEntity } from '../../domain/subscription-plan.entity';

@Injectable()
export class ListPlansHandler {
  constructor(
    @Inject(SUBSCRIPTION_PLAN_REPOSITORY)
    private readonly planRepository: ISubscriptionPlanRepository,
  ) {}

  async handle(): Promise<SubscriptionPlanEntity[]> {
    return await this.planRepository.findAll();
  }
}
