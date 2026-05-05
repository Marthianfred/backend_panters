import { Test, TestingModule } from '@nestjs/testing';
import { RenewSubscriptionUseCase } from './renew-subscription.use-case';
import { ConfigService } from '@nestjs/config';
import { StripeService } from '@/core/infrastructure/stripe/stripe.service';
import { PostgresUsersManagementRepository } from '@/features/users/management/infrastructure/postgres.users-management.repository';
import * as userSubscriptionsInterface from '@/features/subscriptions/interfaces/user.subscriptions.repository.interface';
import * as subscriptionPlansInterface from '@/features/subscriptions/interfaces/subscription.plans.repository.interface';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('RenewSubscriptionUseCase', () => {
  let useCase: RenewSubscriptionUseCase;
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
        RenewSubscriptionUseCase,
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

    useCase = module.get<RenewSubscriptionUseCase>(RenewSubscriptionUseCase);
  });

  it('debería lanzar NotFoundException si la suscripción no existe', async () => {
    userSubscriptionsRepository.findActiveByUserId.mockResolvedValue(null);

    await expect(useCase.execute({ userId: 'user-1' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('debería generar una sesión de Stripe correctamente', async () => {
    const mockSubscription = {
      id: 'sub-1',
      userId: 'user-1',
      planId: 'plan-1',
    };
    const mockPlan = {
      id: 'plan-1',
      stripePriceId: 'price-1',
      durationDays: 30,
    };
    const mockUser = {
      id: 'user-1',
      email: 'test@test.com',
      name: 'Test User',
    };

    userSubscriptionsRepository.findActiveByUserId.mockResolvedValue(
      mockSubscription,
    );
    plansRepository.findById.mockResolvedValue(mockPlan);
    usersRepository.getUserDetails.mockResolvedValue(mockUser);
    stripeService.getOrCreateCustomer.mockResolvedValue('cus-1');
    stripeService.createCheckoutSession.mockResolvedValue({
      url: 'http://stripe.url',
      id: 'session-1',
    });

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result).toEqual({
      url: 'http://stripe.url',
      sessionId: 'session-1',
    });
    expect(stripeService.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          action: 'renew',
          userId: 'user-1',
        }),
      }),
    );
  });

  it('debería lanzar BadRequestException si Stripe falla', async () => {
    const mockSubscription = {
      id: 'sub-1',
      userId: 'user-1',
      planId: 'plan-1',
    };
    const mockPlan = { id: 'plan-1', stripePriceId: 'price-1' };
    const mockUser = {
      id: 'user-1',
      email: 'test@test.com',
      name: 'Test User',
    };

    userSubscriptionsRepository.findActiveByUserId.mockResolvedValue(
      mockSubscription,
    );
    plansRepository.findById.mockResolvedValue(mockPlan);
    usersRepository.getUserDetails.mockResolvedValue(mockUser);
    stripeService.getOrCreateCustomer.mockResolvedValue('cus-1');
    stripeService.createCheckoutSession.mockRejectedValue(
      new Error('Stripe error'),
    );

    await expect(useCase.execute({ userId: 'user-1' })).rejects.toThrow(
      BadRequestException,
    );
  });
});
