import { Injectable, Inject } from '@nestjs/common';
import { SUBSCRIPTION_PLAN_REPOSITORY } from '../../domain/subscription-plan.repository.interface';
import type { ISubscriptionPlanRepository } from '../../domain/subscription-plan.repository.interface';
import { CreateSubscriptionPlanDto } from '../../dto/create-subscription-plan.dto';
import { SubscriptionPlanEntity } from '../../domain/subscription-plan.entity';

@Injectable()
export class CreatePlanHandler {
  constructor(
    @Inject(SUBSCRIPTION_PLAN_REPOSITORY)
    private readonly planRepository: ISubscriptionPlanRepository,
  ) {}

  async handle(
    dto: CreateSubscriptionPlanDto,
  ): Promise<SubscriptionPlanEntity> {
    return await this.planRepository.create({
      name: dto.name,
      description: dto.description || null,
      priceUsd: dto.priceUsd,
      durationDays: dto.durationDays,
      benefits: dto.benefits || [],
      stripePriceId: dto.stripePriceId || null,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });
  }
}
