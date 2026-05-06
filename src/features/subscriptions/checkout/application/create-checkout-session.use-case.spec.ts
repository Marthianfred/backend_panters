import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateCheckoutSessionUseCase } from './create-checkout-session.use-case';
import {
  IUserSubscriptionsRepository,
  USER_SUBSCRIPTIONS_REPOSITORY,
} from '@/features/subscriptions/interfaces/user.subscriptions.repository.interface';
import {
  ISubscriptionPlansRepository,
  SUBSCRIPTION_PLANS_REPOSITORY,
} from '@/features/subscriptions/interfaces/subscription.plans.repository.interface';
import { PostgresUsersManagementRepository } from '@/features/users/management/infrastructure/postgres.users-management.repository';
import { StripeService } from '@/core/infrastructure/stripe/stripe.service';

describe('CreateCheckoutSessionUseCase', () => {
  let useCase: CreateCheckoutSessionUseCase;
  let userSubscriptionsRepository: jest.Mocked<IUserSubscriptionsRepository>;
  let plansRepository: jest.Mocked<ISubscriptionPlansRepository>;
  let stripeService: jest.Mocked<StripeService>;
  let configService: jest.Mocked<ConfigService>;
  let usersRepository: jest.Mocked<PostgresUsersManagementRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCheckoutSessionUseCase,
        {
          provide: USER_SUBSCRIPTIONS_REPOSITORY,
          useValue: { findById: jest.fn() },
        },
        {
          provide: SUBSCRIPTION_PLANS_REPOSITORY,
          useValue: { findById: jest.fn() },
        },
        {
          provide: StripeService,
          useValue: {
            createCheckoutSession: jest.fn(),
            getOrCreateCustomer: jest.fn().mockResolvedValue('cus_abc'),
          },
        },
        {
          provide: ConfigService,
          useValue: { getOrThrow: jest.fn() },
        },
        {
          provide: PostgresUsersManagementRepository,
          useValue: { getUserDetails: jest.fn() },
        },
      ],
    }).compile();

    useCase = module.get<CreateCheckoutSessionUseCase>(
      CreateCheckoutSessionUseCase,
    );
    userSubscriptionsRepository = module.get(USER_SUBSCRIPTIONS_REPOSITORY);
    plansRepository = module.get(SUBSCRIPTION_PLANS_REPOSITORY);
    stripeService = module.get(StripeService);
    configService = module.get(ConfigService);
    usersRepository = module.get(PostgresUsersManagementRepository);
  });

  it('debe lanzar NotFoundException si la suscripción no existe', async () => {
    (userSubscriptionsRepository.findById as jest.Mock).mockResolvedValue(null);
    await expect(useCase.execute({ subscriptionId: 'sub-1' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('debe lanzar BadRequestException si el plan no tiene stripePriceId', async () => {
    (userSubscriptionsRepository.findById as jest.Mock).mockResolvedValue({
      id: 'sub-1',
      planId: 'plan-1',
      status: 'pending',
    });
    (plansRepository.findById as jest.Mock).mockResolvedValue({
      id: 'plan-1',
      stripePriceId: null,
    });

    await expect(useCase.execute({ subscriptionId: 'sub-1' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('debe generar una sesión de Stripe exitosamente', async () => {
    (userSubscriptionsRepository.findById as jest.Mock).mockResolvedValue({
      id: 'sub-1',
      planId: 'plan-1',
      userId: 'user-1',
      status: 'pending',
    });
    (plansRepository.findById as jest.Mock).mockResolvedValue({
      id: 'plan-1',
      stripePriceId: 'price_abc',
    });
    (usersRepository.getUserDetails as jest.Mock).mockResolvedValue({
      email: 'test@test.com',
      name: 'Test User',
    });
    (configService.getOrThrow as jest.Mock).mockReturnValue(
      'http://success.com',
    );
    (stripeService.createCheckoutSession as jest.Mock).mockResolvedValue({
      id: 'session-1',
      url: 'http://stripe.com/pay',
    });

    const result = await useCase.execute({ subscriptionId: 'sub-1' });

    expect(result.url).toBe('http://stripe.com/pay');
    expect(result.sessionId).toBe('session-1');
    expect(stripeService.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        priceId: 'price_abc',
        subscriptionId: 'sub-1',
      }),
    );
  });
});
