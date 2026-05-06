import { Test, TestingModule } from '@nestjs/testing';
import { UpgradeSubscriptionUseCase } from './upgrade-subscription.use-case';
import { ConfigService } from '@nestjs/config';
import { StripeService } from '@/core/infrastructure/stripe/stripe.service';
import { PostgresUsersManagementRepository } from '@/features/users/management/infrastructure/postgres.users-management.repository';
import {
  IUserSubscriptionsRepository,
  USER_SUBSCRIPTIONS_REPOSITORY,
} from '@/features/subscriptions/interfaces/user.subscriptions.repository.interface';
import {
  ISubscriptionPlansRepository,
  SUBSCRIPTION_PLANS_REPOSITORY,
} from '@/features/subscriptions/interfaces/subscription.plans.repository.interface';
import { NotFoundException, BadRequestException } from '@nestjs/common';

import { SubscriptionPlanDto } from '@/features/subscriptions/plans.models';
import { UserSubscriptionDto } from '@/features/subscriptions/interfaces/user.subscriptions.repository.interface';
import { UserManagementDetails } from '@/features/users/management/infrastructure/postgres.users-management.repository';
import Stripe from 'stripe';

describe('UpgradeSubscriptionUseCase', () => {
  let useCase: UpgradeSubscriptionUseCase;
  let userSubscriptionsRepository: jest.Mocked<IUserSubscriptionsRepository>;
  let plansRepository: jest.Mocked<ISubscriptionPlansRepository>;
  let stripeService: jest.Mocked<StripeService>;
  let usersRepository: jest.Mocked<PostgresUsersManagementRepository>;

  beforeEach(async () => {
    userSubscriptionsRepository = {
      findActiveByUserId: jest.fn(),
    } as unknown as jest.Mocked<IUserSubscriptionsRepository>;
    plansRepository = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<ISubscriptionPlansRepository>;
    stripeService = {
      getOrCreateCustomer: jest.fn(),
      createCheckoutSession: jest.fn(),
    } as unknown as jest.Mocked<StripeService>;
    usersRepository = {
      getUserDetails: jest.fn(),
    } as unknown as jest.Mocked<PostgresUsersManagementRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpgradeSubscriptionUseCase,
        {
          provide: USER_SUBSCRIPTIONS_REPOSITORY,
          useValue: userSubscriptionsRepository,
        },
        {
          provide: SUBSCRIPTION_PLANS_REPOSITORY,
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

    useCase = module.get<UpgradeSubscriptionUseCase>(
      UpgradeSubscriptionUseCase,
    );
  });

  it('debería lanzar NotFoundException si no hay suscripción activa', async () => {
    (
      userSubscriptionsRepository.findActiveByUserId as jest.Mock
    ).mockResolvedValue(null);

    await expect(
      useCase.execute('user-1', { targetPlanId: 'plan-2' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('debería lanzar BadRequestException si el plan objetivo no es superior', async () => {
    const mockSubscription: Partial<UserSubscriptionDto> = {
      id: 'sub-1',
      userId: 'user-1',
      planId: 'plan-1',
    };
    const mockCurrentPlan: Partial<SubscriptionPlanDto> = {
      id: 'plan-1',
      priceUsd: 25,
    };
    const mockTargetPlan: Partial<SubscriptionPlanDto> = {
      id: 'plan-2',
      priceUsd: 20,
      isActive: true,
    };

    (
      userSubscriptionsRepository.findActiveByUserId as jest.Mock
    ).mockResolvedValue(mockSubscription);
    (plansRepository.findById as jest.Mock).mockImplementation((id: string) => {
      if (id === 'plan-1')
        return Promise.resolve(mockCurrentPlan as SubscriptionPlanDto);
      if (id === 'plan-2')
        return Promise.resolve(mockTargetPlan as SubscriptionPlanDto);
      return Promise.resolve(null);
    });

    await expect(
      useCase.execute('user-1', { targetPlanId: 'plan-2' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('debería generar una sesión de Stripe para el upgrade correctamente', async () => {
    const mockSubscription: Partial<UserSubscriptionDto> = {
      id: 'sub-1',
      userId: 'user-1',
      planId: 'plan-1',
    };
    const mockCurrentPlan: Partial<SubscriptionPlanDto> = {
      id: 'plan-1',
      priceUsd: 25,
    };
    const mockTargetPlan: Partial<SubscriptionPlanDto> = {
      id: 'plan-2',
      priceUsd: 60,
      isActive: true,
      stripePriceId: 'price-2',
    };
    const mockUser: Partial<UserManagementDetails> = {
      id: 'user-1',
      email: 'test@test.com',
      name: 'Test User',
    };

    (
      userSubscriptionsRepository.findActiveByUserId as jest.Mock
    ).mockResolvedValue(mockSubscription);
    (plansRepository.findById as jest.Mock).mockImplementation((id: string) => {
      if (id === 'plan-1')
        return Promise.resolve(mockCurrentPlan as SubscriptionPlanDto);
      if (id === 'plan-2')
        return Promise.resolve(mockTargetPlan as SubscriptionPlanDto);
      return Promise.resolve(null);
    });
    (usersRepository.getUserDetails as jest.Mock).mockResolvedValue(
      mockUser as UserManagementDetails,
    );
    (stripeService.getOrCreateCustomer as jest.Mock).mockResolvedValue('cus-1');
    (stripeService.createCheckoutSession as jest.Mock).mockResolvedValue({
      url: 'http://stripe.url',
      id: 'session-2',
    } as unknown as Stripe.Checkout.Session);

    const result = await useCase.execute('user-1', { targetPlanId: 'plan-2' });

    expect(result).toEqual({
      url: 'http://stripe.url',
      sessionId: 'session-2',
    });
    expect(stripeService.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          action: 'upgrade',
          targetPlanId: 'plan-2',
        }) as unknown as Record<string, string>,
      }),
    );
  });
});
