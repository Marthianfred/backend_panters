import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ISubscriptionPlansRepository } from '../interfaces/subscription.plans.repository.interface';
import { SUBSCRIPTION_PLANS_REPOSITORY } from '../interfaces/subscription.plans.repository.interface';

@Injectable()
export class DeletePlanHandler {
  constructor(
    @Inject(SUBSCRIPTION_PLANS_REPOSITORY)
    private readonly repository: ISubscriptionPlansRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
        throw new NotFoundException(`El plan ${id} no existe.`);
    }
    await this.repository.delete(id);
  }
}
