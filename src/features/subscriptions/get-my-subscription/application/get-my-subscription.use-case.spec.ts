import { Test, TestingModule } from '@nestjs/testing';
import { GetMySubscriptionUseCase } from './get-my-subscription.use-case';
import * as userSubscriptionsInterface from '../../interfaces/user.subscriptions.repository.interface';
import { NotFoundException } from '@nestjs/common';

describe('GetMySubscriptionUseCase', () => {
  let useCase: GetMySubscriptionUseCase;
  let subscriptionsRepository: any;

  beforeEach(async () => {
    subscriptionsRepository = {
      findActiveWithPlanByUserId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMySubscriptionUseCase,
        {
          provide: userSubscriptionsInterface.USER_SUBSCRIPTIONS_REPOSITORY,
          useValue: subscriptionsRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetMySubscriptionUseCase>(GetMySubscriptionUseCase);
  });

  it('debería retornar la suscripción activa correctamente', async () => {
    const mockResult = {
      id: 'sub-1',
      status: 'active',
      planName: 'VIP MENSUAL',
      currentPeriodEnd: new Date('2026-05-28T23:59:59Z'),
      cancelAtPeriodEnd: false,
    };

    subscriptionsRepository.findActiveWithPlanByUserId.mockResolvedValue(
      mockResult,
    );

    const result = await useCase.execute('user-1');

    expect(result).toEqual({
      id: 'sub-1',
      status: 'active',
      planName: 'VIP MENSUAL',
      currentPeriodEnd: '2026-05-28T23:59:59.000Z',
      cancelAtPeriodEnd: false,
    });
  });

  it('debería lanzar NotFoundException si no hay suscripción activa', async () => {
    subscriptionsRepository.findActiveWithPlanByUserId.mockResolvedValue(null);

    await expect(useCase.execute('user-1')).rejects.toThrow(NotFoundException);
  });
});
