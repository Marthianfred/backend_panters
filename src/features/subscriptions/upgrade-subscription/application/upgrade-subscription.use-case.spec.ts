import { Test, TestingModule } from '@nestjs/testing';
import { UpgradeSubscriptionUseCase } from './upgrade-subscription.use-case';
import { ConfigService } from '@nestjs/config';
import { StripeService } from '@/core/infrastructure/stripe/stripe.service';
import { PostgresUsersManagementRepository } from '@/features/users/management/infrastructure/postgres.users-management.repository';
import * as userSubscriptionsInterface from '@/features/subscriptions/interfaces/user.subscriptions.repository.interface';
import * as subscriptionPlansInterface from '@/features/subscriptions/interfaces/subscription.plans.repository.interface';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('UpgradeSubscriptionUseCase', () => {
  let useCase: UpgradeSubscriptionUseCase;
  let userSubscriptionsRepository: any;
  let plansRepository: any;
  let stripeService: any;
  let usersRepository: any;

  beforeEach(async () => {
    userSubscriptionsRepository = {
      findActiveByUserId: jest.fn(),
    };
    plansRepository = {
      findById: jest.fn(),
    };
    stripeService = {
      getOrCreateCustomer: jest.fn(),
      createCheckoutSession: jest.fn(),
    };
    usersRepository = {
      getUserDetails: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpgradeSubscriptionUseCase,
        {
          provide: userSubscriptionsInterface.USER_SUBSCRIPTIONS_REPOSITORY,
          useValue: userSubscriptionsRepository,
        },
        {
          provide: subscriptionPlansInterface.SUBSCRIPTION_PLANS_REPOSITORY,
          useValue: plansRepository,
        },
        {
          provide: StripeService,
          useValue: stripeService,
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              if (key === 'STRIPE_SUCCESS_URL') return 'http://success.url';
              if (key === 'STRIPE_CANCEL_URL') return 'http://cancel.url';
            }),
          },
        },
        {
          provide: PostgresUsersManagementRepository,
          useValue: usersRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpgradeSubscriptionUseCase>(UpgradeSubscriptionUseCase);
  });

  it('debería lanzar NotFoundException si no hay suscripción activa', async () => {
    userSubscriptionsRepository.findActiveByUserId.mockResolvedValue(null);

    await expect(useCase.execute('user-1', { targetPlanId: 'plan-2' }))
      .rejects.toThrow(NotFoundException);
  });

  it('debería lanzar BadRequestException si el plan objetivo no es superior', async () => {
    const mockSubscription = { id: 'sub-1', userId: 'user-1', planId: 'plan-1' };
    const mockCurrentPlan = { id: 'plan-1', priceUsd: 25 };
    const mockTargetPlan = { id: 'plan-2', priceUsd: 20, isActive: true };

    userSubscriptionsRepository.findActiveByUserId.mockResolvedValue(mockSubscription);
    plansRepository.findById.mockImplementation((id: string) => {
      if (id === 'plan-1') return Promise.resolve(mockCurrentPlan);
      if (id === 'plan-2') return Promise.resolve(mockTargetPlan);
    });

    await expect(useCase.execute('user-1', { targetPlanId: 'plan-2' }))
      .rejects.toThrow(BadRequestException);
  });

  it('debería generar una sesión de Stripe para el upgrade correctamente', async () => {
    const mockSubscription = { id: 'sub-1', userId: 'user-1', planId: 'plan-1' };
    const mockCurrentPlan = { id: 'plan-1', priceUsd: 25 };
    const mockTargetPlan = { id: 'plan-2', priceUsd: 60, isActive: true, stripePriceId: 'price-2' };
    const mockUser = { id: 'user-1', email: 'test@test.com', name: 'Test User' };

    userSubscriptionsRepository.findActiveByUserId.mockResolvedValue(mockSubscription);
    plansRepository.findById.mockImplementation((id: string) => {
      if (id === 'plan-1') return Promise.resolve(mockCurrentPlan);
      if (id === 'plan-2') return Promise.resolve(mockTargetPlan);
    });
    usersRepository.getUserDetails.mockResolvedValue(mockUser);
    stripeService.getOrCreateCustomer.mockResolvedValue('cus-1');
    stripeService.createCheckoutSession.mockResolvedValue({ url: 'http://stripe.url', id: 'session-2' });

    const result = await useCase.execute('user-1', { targetPlanId: 'plan-2' });

    expect(result).toEqual({
      url: 'http://stripe.url',
      sessionId: 'session-2',
    });
    expect(stripeService.createCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({
      metadata: expect.objectContaining({
        action: 'upgrade',
        targetPlanId: 'plan-2',
      }),
    }));
  });
});
