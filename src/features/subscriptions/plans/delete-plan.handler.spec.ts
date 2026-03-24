import { Test, TestingModule } from '@nestjs/testing';
import { DeletePlanHandler } from './delete-plan.handler';
import { SUBSCRIPTION_PLANS_REPOSITORY } from '../interfaces/subscription.plans.repository.interface';
import { NotFoundException } from '@nestjs/common';

describe('DeletePlanHandler', () => {
  let handler: DeletePlanHandler;
  let repository: any;

  beforeEach(async () => {
    repository = {
      findById: jest.fn(),
      delete: jest.fn(),
    };

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
      const mockPlan = { 
        id: planId, 
        name: 'VIP SEMESTRAL', 
        isActive: true 
      };

      repository.findById.mockResolvedValue(mockPlan);
      repository.delete.mockResolvedValue(undefined);

      await handler.execute(planId);

      expect(repository.findById).toHaveBeenCalledWith(planId);
      expect(repository.delete).toHaveBeenCalledWith(planId);
    });

    it('debe lanzar NotFoundException si el plan no existe', async () => {
      const planId = 'non-existent-id';
      repository.findById.mockResolvedValue(null);

      await expect(handler.execute(planId)).rejects.toThrow(NotFoundException);
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });
});
