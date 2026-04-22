import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import * as createCheckoutSessionUseCase_1 from '../application/create-checkout-session.use-case';

@ApiTags('Subscriptions Checkout')
@Controller('api/v1/subscriptions/checkout')
export class CheckoutController {
  constructor(
    private readonly createCheckoutSessionUseCase: createCheckoutSessionUseCase_1.CreateCheckoutSessionUseCase,
  ) {}

  @Post('session')
  @ApiOperation({ summary: 'Genera una sesión de pago en Stripe para una suscripción' })
  async createSession(@Body() dto: createCheckoutSessionUseCase_1.CreateCheckoutSessionDto) {
    return this.createCheckoutSessionUseCase.execute(dto);
  }
}
