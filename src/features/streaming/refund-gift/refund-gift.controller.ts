import { Controller, Post, Body } from '@nestjs/common';
import { RefundGiftHandler } from './refund-gift.handler';
import type { RefundGiftRequest, RefundGiftResponse } from './refund-gift.models';

@Controller('api/v1/gifts')
export class RefundGiftController {
  constructor(private readonly handler: RefundGiftHandler) {}

  @Post('refund')
  public async refundGift(
    @Body() body: RefundGiftRequest,
  ): Promise<RefundGiftResponse> {
    return await this.handler.execute(body);
  }
}
