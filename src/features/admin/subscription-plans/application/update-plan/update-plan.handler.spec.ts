import { Test, TestingModule } from '@nestjs/testing';
import { UpdatePlanHandler } from './update-plan.handler';
import { SUBSCRIPTION_PLAN_REPOSITORY } from '../../domain/subscription-plan.repository.interface';
import { SubscriptionPlanEntity } from '../../domain/subscription-plan.entity';
import { NotFoundException } from '@nestjs/common';

describe('UpdatePlanHandler', () => {
  let handler: UpdatePlanHandler;
  let repository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdatePlanHandler,
        {
          provide: SUBSCRIPTION_PLAN_REPOSITORY,
          useValue: {
            findById: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    handler = module.get<UpdatePlanHandler>(UpdatePlanHandler);
    repository = module.get(SUBSCRIPTION_PLAN_REPOSITORY);
  });

  it('should update a subscription plan successfully', async () => {
    const id = 'uuid';
    const dto = { name: 'Updated Name' };
    const existingPlan = new SubscriptionPlanEntity({ id, name: 'Old Name' });

    repository.findById.mockResolvedValue(existingPlan);
    repository.update.mockResolvedValue({ ...existingPlan, ...dto });

    const result = await handler.handle(id, dto);

    expect(result.name).toBe(dto.name);
    expect(repository.update).toHaveBeenCalled();
  });

  it('should throw NotFoundException if plan does not exist', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(handler.handle('non-existent', {})).rejects.toThrow(
      NotFoundException,
    );
  });
});
