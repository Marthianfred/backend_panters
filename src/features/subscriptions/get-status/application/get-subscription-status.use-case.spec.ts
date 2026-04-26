import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetSubscriptionStatusUseCase } from './get-subscription-status.use-case';
import { USER_SUBSCRIPTIONS_REPOSITORY } from '../../interfaces/user.subscriptions.repository.interface';
import { IUserSubscriptionsRepository } from '../../interfaces/user.subscriptions.repository.interface';

describe('GetSubscriptionStatusUseCase', () => {
  let useCase: GetSubscriptionStatusUseCase;
  let repository: IUserSubscriptionsRepository;

  const mockSubscription = {
    id: 'efff0bd2-0227-48d1-8e17-a0d546a11182',
    userId: 'user_123',
    planId: 'plan_456',
    status: 'active',
    paymentGateway: 'stripe',
    externalSubscriptionId: 'sub_789',
    startsAt: new Date(),
    endsAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetSubscriptionStatusUseCase,
        {
          provide: USER_SUBSCRIPTIONS_REPOSITORY,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<GetSubscriptionStatusUseCase>(GetSubscriptionStatusUseCase);
    repository = module.get<IUserSubscriptionsRepository>(USER_SUBSCRIPTIONS_REPOSITORY);
  });

  it('debe estar definido', () => {
    expect(useCase).toBeDefined();
  });

  it('debe retornar el estatus de la suscripción si existe', async () => {
    jest.spyOn(repository, 'findById').mockResolvedValue(mockSubscription);

    const result = await useCase.execute(mockSubscription.id);

    expect(repository.findById).toHaveBeenCalledWith(mockSubscription.id);
    expect(result).toEqual({
      id: mockSubscription.id,
      status: mockSubscription.status,
      paymentGateway: mockSubscription.paymentGateway,
      externalSubscriptionId: mockSubscription.externalSubscriptionId,
      updatedAt: mockSubscription.updatedAt,
    });
  });

  it('debe lanzar NotFoundException si la suscripción no existe', async () => {
    jest.spyOn(repository, 'findById').mockResolvedValue(null);

    await expect(useCase.execute('non-existent-id')).rejects.toThrow(NotFoundException);
  });
});
