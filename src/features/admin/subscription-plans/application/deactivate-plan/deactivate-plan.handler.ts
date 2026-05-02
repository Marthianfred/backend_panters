import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SUBSCRIPTION_PLAN_REPOSITORY } from '../../domain/subscription-plan.repository.interface';
import type { ISubscriptionPlanRepository } from '../../domain/subscription-plan.repository.interface';

@Injectable()
export class DeactivatePlanHandler {
  constructor(
    @Inject(SUBSCRIPTION_PLAN_REPOSITORY)
    private readonly planRepository: ISubscriptionPlanRepository,
  ) {}

  async handle(id: string): Promise<void> {
    const existingPlan = await this.planRepository.findById(id);
    if (!existingPlan) {
      throw new NotFoundException(`Plan de suscripción con ID ${id} no encontrado`);
    }

    await this.planRepository.toggleStatus(id, false);
  }
}
