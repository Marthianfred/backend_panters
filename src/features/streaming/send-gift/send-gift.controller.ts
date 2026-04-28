import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { SendGiftHandler } from './send-gift.handler';
import { SendGiftRequest, SendGiftResponse } from './send-gift.models';

@Controller('api/v1/gifts')
export class SendGiftController {
  constructor(private readonly handler: SendGiftHandler) {}

  @Post('send')
  
  public async sendGift(
    @Body() body: { creatorId: string; giftId: string; userId: string },
  ): Promise<SendGiftResponse> {
    const request: SendGiftRequest = {
      userId: body.userId, 
      creatorId: body.creatorId,
      giftId: body.giftId,
    };

    return await this.handler.execute(request);
  }
}
