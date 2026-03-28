import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  HttpException,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { StripeWebhookHandler } from './stripe-webhook.handler';
import { BinanceWebhookHandler } from './binance-webhook.handler';
import {
  WebhookResponse,
  InvalidSignatureError,
} from './webhooks-top-up.models';

interface RequestWithRawBody extends Request {
  rawBody?: Buffer;
}

@Controller('api/v1/wallet/webhooks')
export class WebhooksTopUpController {
  constructor(
    private readonly stripeHandler: StripeWebhookHandler,
    private readonly binanceHandler: BinanceWebhookHandler,
  ) {}

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  public async handleStripe(
    @Req() req: RequestWithRawBody,
    @Headers('stripe-signature') signature: string,
  ): Promise<WebhookResponse> {
    try {
      // Usamos req.rawBody para validación de firma y req.body para datos
      return await this.stripeHandler.execute(req.rawBody || req.body, signature || '');
    } catch (error) {
      if (error instanceof InvalidSignatureError) {
        throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
      }
      throw new HttpException(
        `Error procesando webhook de Stripe: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('binance')
  @HttpCode(HttpStatus.OK)
  public async handleBinance(
    @Req() req: RequestWithRawBody,
    @Headers('binancepay-signature') signature: string,
  ): Promise<WebhookResponse> {
    try {
      return await this.binanceHandler.execute(req.rawBody || req.body, signature || '');
    } catch (error) {
      if (error instanceof InvalidSignatureError) {
        throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
      }
      throw new HttpException(
        `Error procesando webhook de Binance: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
