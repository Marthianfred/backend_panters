import {
  Controller,
  Post,
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

  /**
   * @deprecated Usar api/v1/payments/webhooks/stripe (Dispatcher Unificado)
   */
  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  public async handleStripe(
    @Req() req: RequestWithRawBody,
    @Headers('stripe-signature') signature: string,
  ): Promise<WebhookResponse> {
    // Redirigir o lanzar error para forzar migración a dispatcher unificado
    throw new HttpException(
      'Este endpoint está deprecado. Use el dispatcher unificado en api/v1/payments/webhooks/stripe',
      HttpStatus.GONE,
    );
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
