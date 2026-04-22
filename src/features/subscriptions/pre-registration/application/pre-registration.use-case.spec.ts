import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PreRegistrationUseCase } from './pre-registration.use-case';
import { RegisterClientService } from '@/features/auth/application/register-client.service';
import { SUBSCRIPTION_PLANS_REPOSITORY } from '@/features/subscriptions/interfaces/subscription.plans.repository.interface';
import { USER_SUBSCRIPTIONS_REPOSITORY } from '@/features/subscriptions/interfaces/user.subscriptions.repository.interface';
import { CreateCheckoutSessionUseCase } from '@/features/subscriptions/checkout/application/create-checkout-session.use-case';
import { PreRegistrationRequestDto } from '../domain/pre-registration.dto';

describe('PreRegistrationUseCase', () => {
  let useCase: PreRegistrationUseCase;
  let registerClientService: jest.Mocked<RegisterClientService>;
  let plansRepository: any;
  let userSubscriptionsRepository: any;
  let createCheckoutSessionUseCase: jest.Mocked<CreateCheckoutSessionUseCase>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PreRegistrationUseCase,
        {
          provide: RegisterClientService,
          useValue: {
            register: jest.fn(),
          },
        },
        {
          provide: SUBSCRIPTION_PLANS_REPOSITORY,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: USER_SUBSCRIPTIONS_REPOSITORY,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: CreateCheckoutSessionUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<PreRegistrationUseCase>(PreRegistrationUseCase);
    registerClientService = module.get(RegisterClientService);
    plansRepository = module.get(SUBSCRIPTION_PLANS_REPOSITORY);
    userSubscriptionsRepository = module.get(USER_SUBSCRIPTIONS_REPOSITORY);
    createCheckoutSessionUseCase = module.get(CreateCheckoutSessionUseCase);
    
    createCheckoutSessionUseCase.execute.mockResolvedValue({
      url: 'https://stripe.com/checkout',
      sessionId: 'sess_123',
    });
  });

  const mockDto: PreRegistrationRequestDto = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    username: 'testuser',
    birthDate: '1995-05-05',
    gender: 'male',
    age: 28,
    planId: 'plan-uuid',
  };

  it('debe lanzar NotFoundException si el plan no existe', async () => {
    plansRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(mockDto)).rejects.toThrow(NotFoundException);
  });

  it('debe lanzar BadRequestException si el registro de usuario falla', async () => {
    plansRepository.findById.mockResolvedValue({ id: 'plan-uuid', isActive: true });
    registerClientService.register.mockResolvedValue({ success: false, message: 'Error', user: null as any });

    await expect(useCase.execute(mockDto)).rejects.toThrow(BadRequestException);
  });

  it('debe completar el pre-registro exitosamente', async () => {
    plansRepository.findById.mockResolvedValue({ id: 'plan-uuid', isActive: true });
    registerClientService.register.mockResolvedValue({
      success: true,
      message: 'Ok',
      user: { id: 'user-id', email: 'test@example.com', name: 'Test User' },
    });
    userSubscriptionsRepository.create.mockResolvedValue({ id: 'sub-id' });

    const result = await useCase.execute(mockDto);

    expect(result.success).toBe(true);
    expect(result.userId).toBe('user-id');
    expect(result.subscriptionId).toBe('sub-id');
    expect(result.checkoutUrl).toBe('https://stripe.com/checkout');
    expect(result.sessionId).toBe('sess_123');
    expect(userSubscriptionsRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user-id',
      planId: 'plan-uuid',
      status: 'pending',
    }));
  });
});
