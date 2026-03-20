import { Inject, Injectable } from '@nestjs/common';
import type { ISubscriptionPlansRepository } from '../interfaces/subscription.plans.repository.interface';
import { SUBSCRIPTION_PLANS_REPOSITORY } from '../interfaces/subscription.plans.repository.interface';
import { SubscriptionPlanDto } from '../plans.models';

@Injectable()
export class ListPlansHandler {
  constructor(
    @Inject(SUBSCRIPTION_PLANS_REPOSITORY)
    private readonly repository: ISubscriptionPlansRepository,
  ) {}

  async execute(): Promise<SubscriptionPlanDto[]> {
    return await this.repository.findAll();
  }
}
