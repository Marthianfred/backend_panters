import { Test, TestingModule } from '@nestjs/testing';
import { DeletePlanHandler } from './delete-plan.handler';
import {
  ISubscriptionPlansRepository,
  SUBSCRIPTION_PLANS_REPOSITORY,
} from '../interfaces/subscription.plans.repository.interface';
import { NotFoundException } from '@nestjs/common';
import { SubscriptionPlanDto } from '../plans.models';

describe('DeletePlanHandler', () => {
  let handler: DeletePlanHandler;
  let repository: jest.Mocked<ISubscriptionPlansRepository>;

  beforeEach(async () => {
    repository = {
      findById: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<ISubscriptionPlansRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeletePlanHandler,
        { provide: SUBSCRIPTION_PLANS_REPOSITORY, useValue: repository },
      ],
    }).compile();

    handler = module.get<DeletePlanHandler>(DeletePlanHandler);
  });

  describe('execute', () => {
    it('debe desactivar el plan si existe correctamente', async () => {
      const planId = 'fa6662ae-6d48-490b-8074-fab0b2e1aa64';
      const mockPlan: SubscriptionPlanDto = {
        id: planId,
        name: 'VIP SEMESTRAL',
        isActive: true,
        priceUsd: 100,
        durationDays: 180,
        stripePriceId: 'price_123',
        createdAt: new Date(),
        updatedAt: new Date(),
        benefits: [],
      };

      (repository.findById as jest.Mock).mockResolvedValue(mockPlan);
      (repository.delete as jest.Mock).mockResolvedValue(undefined);

      await handler.execute(planId);

      expect(repository.findById).toHaveBeenCalledWith(planId);
      expect(repository.delete).toHaveBeenCalledWith(planId);
    });

    it('debe lanzar NotFoundException si el plan no existe', async () => {
      const planId = 'non-existent-id';
      (repository.findById as jest.Mock).mockResolvedValue(null);

      await expect(handler.execute(planId)).rejects.toThrow(NotFoundException);
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });
});
