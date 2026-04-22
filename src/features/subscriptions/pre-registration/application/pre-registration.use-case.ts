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
    // 1. Verificar que el plan exista
    const plan = await this.plansRepository.findById(dto.planId);
    if (!plan || !plan.isActive) {
      throw new NotFoundException('El plan de suscripción seleccionado no existe o no está activo.');
    }

    // 2. Registrar al usuario como cliente (subscriber)
    // El RegisterClientService ya maneja la creación en Better Auth y el envío de correo de verificación
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

    // 3. Crear el registro de suscripción en estado 'pending'
    // Se establece el acceso bloqueado hasta que el pago sea confirmado via Webhook (Stripe/PayPal)
    const subscription = await this.userSubscriptionsRepository.create({
      userId: userId,
      planId: plan.id,
      status: 'pending',
      paymentGateway: 'stripe', // Por defecto para este flujo inicial
    });

    // 4. Generar la sesión de pago automáticamente
    const checkout = await this.createCheckoutSessionUseCase.execute({
      subscriptionId: subscription.id,
    });

    // 5. Retornar los datos para redirigir al pago en el frontend
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
