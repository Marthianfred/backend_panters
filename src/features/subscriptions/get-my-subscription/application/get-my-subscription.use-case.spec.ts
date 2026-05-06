import { Test, TestingModule } from '@nestjs/testing';
import { GetMySubscriptionUseCase } from './get-my-subscription.use-case';
import {
  IUserSubscriptionsRepository,
  USER_SUBSCRIPTIONS_REPOSITORY,
  UserSubscriptionWithPlanDto,
} from '../../interfaces/user.subscriptions.repository.interface';

describe('GetMySubscriptionUseCase', () => {
  let useCase: GetMySubscriptionUseCase;
  let subscriptionsRepository: jest.Mocked<IUserSubscriptionsRepository>;

  beforeEach(async () => {
    subscriptionsRepository = {
      findActiveWithPlanByUserId: jest.fn(),
    } as unknown as jest.Mocked<IUserSubscriptionsRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMySubscriptionUseCase,
        {
          provide: USER_SUBSCRIPTIONS_REPOSITORY,
          useValue: subscriptionsRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetMySubscriptionUseCase>(GetMySubscriptionUseCase);
  });

  it('debería retornar la suscripción activa correctamente', async () => {
    const mockResult: UserSubscriptionWithPlanDto = {
      id: 'sub-1',
      status: 'active',
      planName: 'VIP MENSUAL',
      currentPeriodEnd: new Date('2026-05-28T23:59:59Z'),
      cancelAtPeriodEnd: false,
    };

    (
      subscriptionsRepository.findActiveWithPlanByUserId as jest.Mock
    ).mockResolvedValue(mockResult);

    const result = await useCase.execute('user-1');

    expect(result).toEqual({
      id: 'sub-1',
      status: 'active',
      planName: 'VIP MENSUAL',
      currentPeriodEnd: '2026-05-28T23:59:59.000Z',
      cancelAtPeriodEnd: false,
    });
  });

  it('debería retornar null si no hay suscripción activa', async () => {
    subscriptionsRepository.findActiveWithPlanByUserId.mockResolvedValue(null);

    const result = await useCase.execute('user-1');
    expect(result).toBeNull();
  });
});
