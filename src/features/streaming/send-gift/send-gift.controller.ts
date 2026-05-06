import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { SendGiftHandler } from './send-gift.handler';
import { SendGiftResponse } from './send-gift.models';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { Role } from '../../../core/auth/roles.enum';
import type { AuthenticatedRequest } from '../../auth/types/auth.types';

@Controller('api/v1/gifts')
@UseGuards(AuthGuard, RolesGuard)
export class SendGiftController {
  constructor(private readonly handler: SendGiftHandler) {}

  @Post('send')
  @Roles(Role.SUBSCRIBER, Role.MODEL, Role.ADMIN)
  public async sendGift(
    @Req() req: AuthenticatedRequest,
    @Body() body: { creatorId: string; giftId: string },
  ): Promise<SendGiftResponse> {
    if (!req.user) throw new BadRequestException('Usuario no autenticado');
    const request = {
      userId: req.user.id,
      creatorId: body.creatorId,
      giftId: body.giftId,
    };

    return await this.handler.execute(request);
  }
}
