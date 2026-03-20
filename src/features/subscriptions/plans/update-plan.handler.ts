import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ISubscriptionPlansRepository } from '../interfaces/subscription.plans.repository.interface';
import { SUBSCRIPTION_PLANS_REPOSITORY } from '../interfaces/subscription.plans.repository.interface';
import { UpdatePlanDto, SubscriptionPlanDto } from '../plans.models';

@Injectable()
export class UpdatePlanHandler {
  constructor(
    @Inject(SUBSCRIPTION_PLANS_REPOSITORY)
    private readonly repository: ISubscriptionPlansRepository,
  ) {}

  async execute(id: string, dto: UpdatePlanDto): Promise<SubscriptionPlanDto> {
    const existing = await this.repository.findById(id);
    if (!existing) {
        throw new NotFoundException(`El plan ${id} no existe.`);
    }
    return await this.repository.update(id, dto);
  }
}
