import { Controller, Post, Body, Req, Param, UseGuards } from '@nestjs/common';
import { RequestPrivateChatHandler } from './request-chat/request-private-chat.handler';
import { JoinPrivateChatHandler } from './join-chat/join-private-chat.handler';
import { RequestPrivateChatDto } from './request-chat/request-private-chat.models';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../core/auth/decorators/roles.decorator';
import { Role } from '../../core/auth/roles.enum';
import type { AuthenticatedRequest } from '../auth/types/auth.types';

@Controller('video-chat')
@UseGuards(AuthGuard, RolesGuard)
export class VideoChatController {
  constructor(
    private readonly requestHandler: RequestPrivateChatHandler,
    private readonly joinHandler: JoinPrivateChatHandler,
  ) {}

  @Post('request')
  @Roles(Role.SUBSCRIBER, Role.MODEL, Role.ADMIN)
  async requestPrivateChat(
    @Req() req: AuthenticatedRequest,
    @Body() dto: RequestPrivateChatDto,
  ) {
    const userId = req.user.id;
    return this.requestHandler.execute(userId, dto);
  }

  @Post('join/:sessionId')
  @Roles(Role.SUBSCRIBER, Role.MODEL, Role.ADMIN)
  async joinPrivateChat(
    @Req() req: AuthenticatedRequest,
    @Param('sessionId') sessionId: string,
  ) {
    const userId = req.user.id;
    return this.joinHandler.execute(userId, sessionId);
  }
}
