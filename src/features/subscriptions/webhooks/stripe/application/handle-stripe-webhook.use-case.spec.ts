import { Test, TestingModule } from '@nestjs/testing';
import { HandleStripeWebhookUseCase } from './handle-stripe-webhook.use-case';
import { USER_SUBSCRIPTIONS_REPOSITORY } from '@/features/subscriptions/interfaces/user.subscriptions.repository.interface';
import { BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';

describe('HandleStripeWebhookUseCase', () => {
  let useCase: HandleStripeWebhookUseCase;
  let userSubscriptionsRepository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HandleStripeWebhookUseCase,
        {
          provide: USER_SUBSCRIPTIONS_REPOSITORY,
          useValue: {
            updateStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<HandleStripeWebhookUseCase>(HandleStripeWebhookUseCase);
    userSubscriptionsRepository = module.get(USER_SUBSCRIPTIONS_REPOSITORY);
  });

  it('debe procesar checkout.session.completed y activar la suscripción', async () => {
    const mockSession = {
      metadata: { subscriptionId: 'sub-123' },
      subscription: 'stripe-sub-id',
    } as any;

    const mockEvent = {
      type: 'checkout.session.completed',
      id: 'evt_123',
      data: { object: mockSession },
    } as any;

    await useCase.execute(mockEvent);

    expect(userSubscriptionsRepository.updateStatus).toHaveBeenCalledWith(
      'sub-123',
      'active',
      'stripe-sub-id'
    );
  });

  it('debe registrar un error si no hay subscriptionId en la metadata', async () => {
    const mockSession = {
      metadata: {},
    } as any;

    const mockEvent = {
      type: 'checkout.session.completed',
      data: { object: mockSession },
    } as any;

    // No debe lanzar error pero sí registrarlo (el log se puede verificar si fuera necesario)
    await useCase.execute(mockEvent);

    expect(userSubscriptionsRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('debe lanzar BadRequestException si el repositorio falla', async () => {
    const mockSession = {
      metadata: { subscriptionId: 'sub-123' },
      subscription: 'stripe-sub-id',
    } as any;

    const mockEvent = {
      type: 'checkout.session.completed',
      data: { object: mockSession },
    } as any;

    userSubscriptionsRepository.updateStatus.mockRejectedValue(new Error('DB Error'));

    await expect(useCase.execute(mockEvent)).rejects.toThrow(BadRequestException);
  });
});
