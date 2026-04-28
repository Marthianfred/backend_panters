import { Controller, Post, Body, Req, Param } from '@nestjs/common';
import { RequestPrivateChatHandler } from './request-chat/request-private-chat.handler';
import { JoinPrivateChatHandler } from './join-chat/join-private-chat.handler';
import { RequestPrivateChatDto } from './request-chat/request-private-chat.models';

@Controller('video-chat')
export class VideoChatController {
  constructor(
    private readonly requestHandler: RequestPrivateChatHandler,
    private readonly joinHandler: JoinPrivateChatHandler,
  ) {}

  @Post('request')
  async requestPrivateChat(@Req() req: any, @Body() dto: RequestPrivateChatDto) {
    const userId = req.user?.id || 'demo-user-id';
    return this.requestHandler.execute(userId, dto);
  }

  @Post('join/:sessionId')
  async joinPrivateChat(@Req() req: any, @Param('sessionId') sessionId: string) {
    const userId = req.user?.id || 'demo-user-id';
    return this.joinHandler.execute(userId, sessionId);
  }
}
