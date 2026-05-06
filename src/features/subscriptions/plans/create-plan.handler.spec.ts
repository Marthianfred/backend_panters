import { Test, TestingModule } from '@nestjs/testing';
import { CreatePlanHandler } from './create-plan.handler';
import {
  ISubscriptionPlansRepository,
  SUBSCRIPTION_PLANS_REPOSITORY,
} from '../interfaces/subscription.plans.repository.interface';
import { SubscriptionPlanDto, CreatePlanDto } from '../plans.models';

describe('CreatePlanHandler', () => {
  let handler: CreatePlanHandler;
  let repository: jest.Mocked<ISubscriptionPlansRepository>;

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
    } as unknown as jest.Mocked<ISubscriptionPlansRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePlanHandler,
        { provide: SUBSCRIPTION_PLANS_REPOSITORY, useValue: repository },
      ],
    }).compile();

    handler = module.get<CreatePlanHandler>(CreatePlanHandler);
  });

  it('debe llamar al repositorio para crear un plan correctamente', async () => {
    const dto: CreatePlanDto = {
      name: 'VIP MENSUAL',
      priceUsd: 25.0,
      durationDays: 30,
      benefits: ['Acceso total'],
    };

    const mockResult: SubscriptionPlanDto = {
      id: 'uuid-1',
      ...dto,
      isActive: true,
      stripePriceId: 'price_123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (repository.create as jest.Mock).mockResolvedValue(mockResult);

    const result = await handler.execute(dto);

    expect(result.id).toBe('uuid-1');
    expect(repository.create).toHaveBeenCalledWith(dto);
  });
});
