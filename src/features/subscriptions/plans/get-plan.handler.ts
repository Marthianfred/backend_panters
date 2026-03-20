import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ISubscriptionPlansRepository } from '../interfaces/subscription.plans.repository.interface';
import { SUBSCRIPTION_PLANS_REPOSITORY } from '../interfaces/subscription.plans.repository.interface';
import { SubscriptionPlanDto } from '../plans.models';

@Injectable()
export class GetPlanHandler {
  constructor(
    @Inject(SUBSCRIPTION_PLANS_REPOSITORY)
    private readonly repository: ISubscriptionPlansRepository,
  ) {}

  async execute(id: string): Promise<SubscriptionPlanDto> {
    const plan = await this.repository.findById(id);
    if (!plan) {
      throw new NotFoundException(`Plan ${id} no encontrado.`);
    }
    return plan;
  }
}
