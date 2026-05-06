import { Test, TestingModule } from '@nestjs/testing';
import { RenewSubscriptionUseCase } from './renew-subscription.use-case';
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

describe('RenewSubscriptionUseCase', () => {
  let useCase: RenewSubscriptionUseCase;
  let userSubscriptionsRepository: jest.Mocked<IUserSubscriptionsRepository>;
  let plansRepository: jest.Mocked<ISubscriptionPlansRepository>;
  let stripeService: jest.Mocked<StripeService>;
  let usersRepository: jest.Mocked<PostgresUsersManagementRepository>;

  beforeEach(async () => {
    userSubscriptionsRepository = {
      findByUserId: jest.fn(),
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
        RenewSubscriptionUseCase,
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

    useCase = module.get<RenewSubscriptionUseCase>(RenewSubscriptionUseCase);
  });

  it('debería lanzar NotFoundException si la suscripción no existe', async () => {
    (userSubscriptionsRepository.findByUserId as jest.Mock).mockResolvedValue(
      [],
    );

    await expect(useCase.execute({ userId: 'user-1' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('debería generar una sesión de Stripe correctamente', async () => {
    const mockSubscription: Partial<UserSubscriptionDto> = {
      id: 'sub-1',
      userId: 'user-1',
      planId: 'plan-1',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(),
    };
    const mockPlan: Partial<SubscriptionPlanDto> = {
      id: 'plan-1',
      name: 'Plan 1',
      priceUsd: 10,
      durationDays: 30,
      stripePriceId: 'price-1',
      isActive: true,
    };
    const mockUser: UserManagementDetails = {
      id: 'user-1',
      email: 'test@test.com',
      name: 'Test User',
      role: 'subscriber',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (userSubscriptionsRepository.findByUserId as jest.Mock).mockResolvedValue([
      mockSubscription,
    ]);
    (plansRepository.findById as jest.Mock).mockResolvedValue(
      mockPlan as SubscriptionPlanDto,
    );
    (usersRepository.getUserDetails as jest.Mock).mockResolvedValue(mockUser);
    (stripeService.getOrCreateCustomer as jest.Mock).mockResolvedValue('cus-1');
    (stripeService.createCheckoutSession as jest.Mock).mockResolvedValue({
      url: 'http://stripe.url',
      id: 'session-1',
    } as unknown as Stripe.Checkout.Session);

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
        }) as unknown as Record<string, string>,
      }),
    );
  });

  it('debería lanzar BadRequestException si Stripe falla', async () => {
    const mockSubscription: Partial<UserSubscriptionDto> = {
      id: 'sub-1',
      userId: 'user-1',
      planId: 'plan-1',
      status: 'active',
    };
    const mockPlan: Partial<SubscriptionPlanDto> = {
      id: 'plan-1',
      stripePriceId: 'price-1',
    };
    const mockUser: Partial<UserManagementDetails> = {
      id: 'user-1',
      email: 'test@test.com',
      name: 'Test User',
    };

    (userSubscriptionsRepository.findByUserId as jest.Mock).mockResolvedValue([
      mockSubscription,
    ]);
    (plansRepository.findById as jest.Mock).mockResolvedValue(
      mockPlan as SubscriptionPlanDto,
    );
    (usersRepository.getUserDetails as jest.Mock).mockResolvedValue(
      mockUser as UserManagementDetails,
    );
    (stripeService.getOrCreateCustomer as jest.Mock).mockResolvedValue('cus-1');
    (stripeService.createCheckoutSession as jest.Mock).mockRejectedValue(
      new Error('Stripe error'),
    );

    await expect(useCase.execute({ userId: 'user-1' })).rejects.toThrow(
      BadRequestException,
    );
  });
});
