import { Controller, Post, Headers, Req, BadRequestException, RawBodyRequest, Logger } from '@nestjs/common';
import { Request } from 'express';
import { StripeService } from '@/core/infrastructure/stripe/stripe.service';
import { HandleStripeWebhookUseCase } from '../application/handle-stripe-webhook.use-case';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Webhooks')
@Controller('api/v1/webhooks/stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly handleStripeWebhookUseCase: HandleStripeWebhookUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Recibe notificaciones de eventos desde Stripe' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: Request & { rawBody: Buffer },
  ) {
    if (!signature) {
      throw new BadRequestException('Falta la firma de Stripe');
    }

    try {
      // Usamos el rawBody que ya viene configurado en main.ts
      const event = this.stripeService.constructEvent(request.rawBody, signature);

      
      await this.handleStripeWebhookUseCase.execute(event);
      
      return { received: true };
    } catch (err) {
      this.logger.error(`Error procesando webhook de Stripe: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }
  }
}
