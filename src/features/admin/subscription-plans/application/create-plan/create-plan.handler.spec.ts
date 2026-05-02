import { Test, TestingModule } from '@nestjs/testing';
import { CreatePlanHandler } from './create-plan.handler';
import { SUBSCRIPTION_PLAN_REPOSITORY } from '../../domain/subscription-plan.repository.interface';
import { SubscriptionPlanEntity } from '../../domain/subscription-plan.entity';

describe('CreatePlanHandler', () => {
  let handler: CreatePlanHandler;
  let repository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePlanHandler,
        {
          provide: SUBSCRIPTION_PLAN_REPOSITORY,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<CreatePlanHandler>(CreatePlanHandler);
    repository = module.get(SUBSCRIPTION_PLAN_REPOSITORY);
  });

  it('should create a subscription plan successfully', async () => {
    const dto = {
      name: 'Plan Test',
      priceUsd: 10,
      durationDays: 30,
      benefits: ['Benefit 1'],
    };

    const expectedResult = new SubscriptionPlanEntity({
      id: 'uuid',
      ...dto,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    repository.create.mockResolvedValue(expectedResult);

    const result = await handler.handle(dto);

    expect(result).toBe(expectedResult);
    expect(repository.create).toHaveBeenCalledWith({
      name: dto.name,
      description: null,
      priceUsd: dto.priceUsd,
      durationDays: dto.durationDays,
      benefits: dto.benefits,
      stripePriceId: null,
      isActive: true,
    });
  });
});
