import { Test, TestingModule } from '@nestjs/testing';
import { CreatePlanHandler } from './create-plan.handler';
import { SUBSCRIPTION_PLANS_REPOSITORY } from '../interfaces/subscription.plans.repository.interface';

describe('CreatePlanHandler', () => {
  let handler: CreatePlanHandler;
  let repository: any;

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePlanHandler,
        { provide: SUBSCRIPTION_PLANS_REPOSITORY, useValue: repository },
      ],
    }).compile();

    handler = module.get<CreatePlanHandler>(CreatePlanHandler);
  });

  it('debe llamar al repositorio para crear un plan correctamente', async () => {
    const dto = {
      name: 'VIP MENSUAL',
      priceUsd: 25.0,
      durationDays: 30,
      benefits: ['Acceso total'],
    };

    repository.create.mockResolvedValue({ id: 'uuid-1', ...dto, isActive: true });

    const result = await handler.execute(dto);

    expect(result.id).toBe('uuid-1');
    expect(repository.create).toHaveBeenCalledWith(dto);
  });
});
