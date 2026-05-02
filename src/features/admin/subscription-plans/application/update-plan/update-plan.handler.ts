import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { SUBSCRIPTION_PLAN_REPOSITORY } from '../../domain/subscription-plan.repository.interface';
import type { ISubscriptionPlanRepository } from '../../domain/subscription-plan.repository.interface';
import { UpdateSubscriptionPlanDto } from '../../dto/update-subscription-plan.dto';
import { SubscriptionPlanEntity } from '../../domain/subscription-plan.entity';

@Injectable()
export class UpdatePlanHandler {
  constructor(
    @Inject(SUBSCRIPTION_PLAN_REPOSITORY)
    private readonly planRepository: ISubscriptionPlanRepository,
  ) {}

  async handle(id: string, dto: UpdateSubscriptionPlanDto): Promise<SubscriptionPlanEntity> {
    const existingPlan = await this.planRepository.findById(id);
    if (!existingPlan) {
      throw new NotFoundException(`Plan de suscripción con ID ${id} no encontrado`);
    }

    return await this.planRepository.update(id, {
      ...dto,
      updatedAt: new Date(),
    });
  }
}
