import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
  Get,
  Query,
  Param,
  Patch,
} from '@nestjs/common';
import { AuthGuard } from '@/features/auth/guards/auth.guard';
import { CurrentUser } from '@/features/auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/features/auth/types/auth.types';
import { RegisterSubscriptionUseCase } from '../application/use-cases/register-subscription.use-case';
import { NotifySubscribersUseCase } from '../application/use-cases/notify-subscribers.use-case';
import { GetNotificationsUseCase } from '../application/use-cases/get-notifications.use-case';
import { MarkNotificationAsReadUseCase } from '../application/use-cases/mark-notification-as-read.use-case';
import { RegisterSubscriptionDto } from './dtos/register-subscription.dto';
import { SendNotificationDto } from './dtos/send-notification.dto';

@Controller('api/notifications')
export class NotificationsController {
  constructor(
    private readonly registerSubscriptionUseCase: RegisterSubscriptionUseCase,
    private readonly notifySubscribersUseCase: NotifySubscribersUseCase,
    private readonly getNotificationsUseCase: GetNotificationsUseCase,
    private readonly markNotificationAsReadUseCase: MarkNotificationAsReadUseCase,
  ) {}

  @Post('subscribe')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async subscribe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegisterSubscriptionDto,
  ) {
    await this.registerSubscriptionUseCase.execute(user.id, dto);
    return { message: 'Suscripción registrada correctamente' };
  }

  @Post('notify-subscribers')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async notifySubscribers(@Body() dto: SendNotificationDto) {
    const result = await this.notifySubscribersUseCase.execute({
      title: dto.title,
      body: dto.body,
      icon: dto.icon,
      data: dto.data,
    });
    return {
      message: 'Proceso de notificación finalizado',
      ...result,
    };
  }

  @Get()
  @UseGuards(AuthGuard)
  async getNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query('unread') unread?: string,
  ) {
    const onlyUnread = unread === 'true';
    const notifications = await this.getNotificationsUseCase.execute(
      user.id,
      onlyUnread,
    );
    return { data: notifications };
  }

  @Patch(':id/read')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAsRead(@Param('id') id: string) {
    await this.markNotificationAsReadUseCase.execute(id);
  }
}
