import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { StripeWebhookHandler } from './stripe-webhook.handler';
import { BinanceWebhookHandler } from './binance-webhook.handler';
import type {
  StripeWebhookPayload,
  BinanceWebhookPayload,
  WebhookResponse,
} from './webhooks-top-up.models';
import { InvalidSignatureError } from './webhooks-top-up.models';

@Controller('api/v1/wallet/webhooks')
export class WebhooksTopUpController {
  constructor(
    private readonly stripeHandler: StripeWebhookHandler,
    private readonly binanceHandler: BinanceWebhookHandler,
  ) {}

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  public async handleStripe(
    @Body() payload: StripeWebhookPayload,
    @Headers('stripe-signature') signature: string,
  ): Promise<WebhookResponse> {
    try {
      return await this.stripeHandler.execute(payload, signature || '');
    } catch (error) {
      if (error instanceof InvalidSignatureError) {
        throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
      }
      throw new HttpException(
        'Error interno procesando webhook de Stripe',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('binance')
  @HttpCode(HttpStatus.OK)
  public async handleBinance(
    @Body() payload: BinanceWebhookPayload,
    @Headers('binancepay-signature') signature: string,
  ): Promise<WebhookResponse> {
    try {
      return await this.binanceHandler.execute(payload, signature || '');
    } catch (error) {
      if (error instanceof InvalidSignatureError) {
        throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
      }
      throw new HttpException(
        'Error interno procesando webhook de Binance',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
