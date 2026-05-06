import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { RequestPrivateChatHandler } from './request-chat/request-private-chat.handler';
import { JoinPrivateChatHandler } from './join-chat/join-private-chat.handler';
import { EndPrivateChatHandler } from './end-chat/end-private-chat.handler';
import { StartPrivateChatHandler } from './start-chat/start-private-chat.handler';
import { ListUserAppointmentsHandler } from './list-appointments/list-user-appointments.handler';
import { RequestPrivateChatDto } from './request-chat/request-private-chat.models';
import { EndPrivateChatDto } from './end-chat/end-private-chat.models';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../core/auth/decorators/roles.decorator';
import { Role } from '../../core/auth/roles.enum';
import type { AuthenticatedRequest } from '../auth/types/auth.types';

@Controller('api/v1/video-chat')
@UseGuards(AuthGuard, RolesGuard)
export class VideoChatController {
  constructor(
    private readonly requestHandler: RequestPrivateChatHandler,
    private readonly joinHandler: JoinPrivateChatHandler,
    private readonly endHandler: EndPrivateChatHandler,
    private readonly startHandler: StartPrivateChatHandler,
    private readonly listHandler: ListUserAppointmentsHandler,
  ) {}

  @Get('appointments')
  @Roles(Role.SUBSCRIBER, Role.MODEL, Role.ADMIN)
  async listAppointments(@Req() req: AuthenticatedRequest) {
    if (!req.user) throw new BadRequestException('Usuario no autenticado');
    const userId = req.user.id;
    return this.listHandler.execute(userId);
  }

  @Post('request')
  @Roles(Role.SUBSCRIBER, Role.MODEL, Role.ADMIN)
  async requestPrivateChat(
    @Req() req: AuthenticatedRequest,
    @Body() dto: RequestPrivateChatDto,
  ) {
    if (!req.user) throw new BadRequestException('Usuario no autenticado');
    const userId = req.user.id;
    return this.requestHandler.execute(userId, dto);
  }

  @Post('join/:sessionId')
  @Roles(Role.SUBSCRIBER, Role.MODEL, Role.ADMIN)
  async joinPrivateChat(
    @Req() req: AuthenticatedRequest,
    @Param('sessionId') sessionId: string,
  ) {
    if (!req.user) throw new BadRequestException('Usuario no autenticado');
    const userId = req.user.id;
    return this.joinHandler.execute(userId, sessionId);
  }

  @Post('start/:sessionId')
  @Roles(Role.SUBSCRIBER, Role.MODEL, Role.ADMIN)
  async startPrivateChat(
    @Req() req: AuthenticatedRequest,
    @Param('sessionId') sessionId: string,
  ) {
    if (!req.user) throw new BadRequestException('Usuario no autenticado');
    const userId = req.user.id;
    return this.startHandler.execute(userId, sessionId);
  }

  @Post('end/:sessionId')
  @Roles(Role.SUBSCRIBER, Role.MODEL, Role.ADMIN)
  async endPrivateChat(
    @Req() req: AuthenticatedRequest,
    @Param('sessionId') sessionId: string,
    @Body() dto: EndPrivateChatDto,
  ) {
    if (!req.user) throw new BadRequestException('Usuario no autenticado');
    const userId = req.user.id;
    return this.endHandler.execute(userId, sessionId, dto);
  }
}
