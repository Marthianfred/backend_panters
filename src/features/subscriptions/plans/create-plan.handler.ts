import { Inject, Injectable } from '@nestjs/common';
import type { ISubscriptionPlansRepository } from '../interfaces/subscription.plans.repository.interface';
import { SUBSCRIPTION_PLANS_REPOSITORY } from '../interfaces/subscription.plans.repository.interface';
import { CreatePlanDto, SubscriptionPlanDto } from '../plans.models';

@Injectable()
export class CreatePlanHandler {
  constructor(
    @Inject(SUBSCRIPTION_PLANS_REPOSITORY)
    private readonly repository: ISubscriptionPlansRepository,
  ) {}

  async execute(dto: CreatePlanDto): Promise<SubscriptionPlanDto> {
    
    return await this.repository.create(dto);
  }
}
