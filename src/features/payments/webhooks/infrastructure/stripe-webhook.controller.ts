import { Controller, Post, Headers, Req, BadRequestException, Logger } from '@nestjs/common';
import { Request } from 'express';
import { StripeService } from '@/core/infrastructure/stripe/stripe.service';
import { HandleUnifiedStripeWebhookUseCase } from '../application/handle-stripe-webhook.use-case';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Payments Webhooks')
@Controller('api/v1/payments/webhooks/stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly handleWebhookUseCase: HandleUnifiedStripeWebhookUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Punto de entrada único para todos los eventos de Stripe' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: Request & { rawBody: Buffer },
  ) {
    if (!signature) {
      this.logger.error('Petición de webhook recibida sin firma de Stripe');
      throw new BadRequestException('Falta la firma de Stripe');
    }

    try {
      
      
      const event = this.stripeService.constructEvent(request.rawBody, signature);
      
      this.logger.log(`Webhook validado correctamente: ${event.type} [${event.id}]`);

      
      await this.handleWebhookUseCase.execute(event);
      
      return { received: true, eventId: event.id };
    } catch (err) {
      this.logger.error(`Fallo crítico en el procesamiento del webhook: ${err.message}`);
      
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }
  }
}
