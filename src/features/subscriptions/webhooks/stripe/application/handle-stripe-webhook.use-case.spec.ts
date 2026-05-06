import { Test, TestingModule } from '@nestjs/testing';
import { HandleStripeWebhookUseCase } from './handle-stripe-webhook.use-case';
import {
  IUserSubscriptionsRepository,
  USER_SUBSCRIPTIONS_REPOSITORY,
} from '@/features/subscriptions/interfaces/user.subscriptions.repository.interface';
import { SUBSCRIPTION_PLANS_REPOSITORY } from '@/features/subscriptions/interfaces/subscription.plans.repository.interface';
import { BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';

describe('HandleStripeWebhookUseCase', () => {
  let useCase: HandleStripeWebhookUseCase;
  let userSubscriptionsRepository: jest.Mocked<IUserSubscriptionsRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HandleStripeWebhookUseCase,
        {
          provide: USER_SUBSCRIPTIONS_REPOSITORY,
          useValue: {
            updateStatus: jest.fn(),
            findById: jest.fn(),
            updatePeriod: jest.fn(),
            changePlan: jest.fn(),
            findByExternalId: jest.fn(),
          },
        },
        {
          provide: SUBSCRIPTION_PLANS_REPOSITORY,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<HandleStripeWebhookUseCase>(
      HandleStripeWebhookUseCase,
    );
    userSubscriptionsRepository = module.get(USER_SUBSCRIPTIONS_REPOSITORY);
  });

  it('debe procesar checkout.session.completed y activar la suscripción', async () => {
    const mockSession = {
      metadata: { subscriptionId: 'sub-123' },
      subscription: 'stripe-sub-id',
    } as unknown as Stripe.Checkout.Session;

    const mockEvent = {
      type: 'checkout.session.completed',
      id: 'evt_123',
      data: { object: mockSession },
    } as unknown as Stripe.Event;

    await useCase.execute(mockEvent);

    expect(userSubscriptionsRepository.updateStatus).toHaveBeenCalledWith(
      'sub-123',
      'active',
      'stripe-sub-id',
    );
  });

  it('debe registrar un error si no hay subscriptionId en la metadata', async () => {
    const mockSession = {
      metadata: {},
    } as unknown as Stripe.Checkout.Session;

    const mockEvent = {
      type: 'checkout.session.completed',
      data: { object: mockSession },
    } as unknown as Stripe.Event;

    await useCase.execute(mockEvent);

    expect(userSubscriptionsRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('debe lanzar BadRequestException si el repositorio falla', async () => {
    const mockSession = {
      metadata: { subscriptionId: 'sub-123' },
      subscription: 'stripe-sub-id',
    } as unknown as Stripe.Checkout.Session;

    const mockEvent = {
      type: 'checkout.session.completed',
      data: { object: mockSession },
    } as unknown as Stripe.Event;

    (userSubscriptionsRepository.updateStatus as jest.Mock).mockRejectedValue(
      new Error('DB Error'),
    );

    await expect(useCase.execute(mockEvent)).rejects.toThrow(
      BadRequestException,
    );
  });
});
