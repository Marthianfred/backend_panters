import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { RegisterClientService } from '@/features/auth/application/register-client.service';
import * as subscriptionPlansInterface from '@/features/subscriptions/interfaces/subscription.plans.repository.interface';
import * as userSubscriptionsInterface from '@/features/subscriptions/interfaces/user.subscriptions.repository.interface';
import { PreRegistrationRequestDto, PreRegistrationResponseDto } from '../domain/pre-registration.dto';
import { CreateCheckoutSessionUseCase } from '@/features/subscriptions/checkout/application/create-checkout-session.use-case';

@Injectable()
export class PreRegistrationUseCase {
  constructor(
    private readonly registerClientService: RegisterClientService,
    @Inject(subscriptionPlansInterface.SUBSCRIPTION_PLANS_REPOSITORY) 
    private readonly plansRepository: subscriptionPlansInterface.ISubscriptionPlansRepository,
    @Inject(userSubscriptionsInterface.USER_SUBSCRIPTIONS_REPOSITORY) 
    private readonly userSubscriptionsRepository: userSubscriptionsInterface.IUserSubscriptionsRepository,
    private readonly createCheckoutSessionUseCase: CreateCheckoutSessionUseCase,
  ) {}

  async execute(dto: PreRegistrationRequestDto): Promise<PreRegistrationResponseDto> {
    
    const plan = await this.plansRepository.findById(dto.planId);
    if (!plan || !plan.isActive) {
      throw new NotFoundException('El plan de suscripción seleccionado no existe o no está activo.');
    }

    
    
    const registerResult = await this.registerClientService.register({
      email: dto.email,
      password: dto.password,
      name: dto.name,
      username: dto.username,
      birthDate: dto.birthDate,
      gender: dto.gender,
      age: dto.age,
    });

    if (!registerResult.success || !registerResult.user) {
      throw new BadRequestException(registerResult.message || 'No se pudo completar el registro del cliente.');
    }
    
    const userId = registerResult.user.id;

    
    
    const subscription = await this.userSubscriptionsRepository.create({
      userId: userId,
      planId: plan.id,
      status: 'pending',
      paymentGateway: 'stripe', 
    });

    
    const checkout = await this.createCheckoutSessionUseCase.execute({
      subscriptionId: subscription.id,
    });

    
    return {
      success: true,
      message: 'Usuario registrado con éxito. Redirigiendo a la pasarela de pago...',
      userId: userId,
      subscriptionId: subscription.id,
      checkoutUrl: checkout.url,
      sessionId: checkout.sessionId,
    };
  }
}
