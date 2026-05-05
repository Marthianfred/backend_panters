import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@/features/auth/auth.module';
import { NotificationsController } from './api/notifications.controller';
import { RegisterSubscriptionUseCase } from './application/use-cases/register-subscription.use-case';
import { NotifySubscribersUseCase } from './application/use-cases/notify-subscribers.use-case';
import { NotifyUserUseCase } from './application/use-cases/notify-user.use-case';
import { GetNotificationsUseCase } from './application/use-cases/get-notifications.use-case';
import { MarkNotificationAsReadUseCase } from './application/use-cases/mark-notification-as-read.use-case';
import { PushSubscriptionOrmEntity } from './infrastructure/persistence/push-subscription.orm-entity';
import { TypeOrmPushSubscriptionRepository } from './infrastructure/persistence/typeorm-push-subscription.repository';
import { NotificationOrmEntity } from './infrastructure/persistence/notification.orm-entity';
import { TypeOrmNotificationRepository } from './infrastructure/persistence/typeorm-notification.repository';
import { PUSH_SUBSCRIPTION_REPOSITORY_TOKEN } from './domain/push-subscription.repository';
import { NOTIFICATION_REPOSITORY_TOKEN } from './domain/notification.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PushSubscriptionOrmEntity,
      NotificationOrmEntity,
    ]),
    ConfigModule,
  ],
  controllers: [NotificationsController],
  providers: [
    RegisterSubscriptionUseCase,
    NotifySubscribersUseCase,
    NotifyUserUseCase,
    GetNotificationsUseCase,
    MarkNotificationAsReadUseCase,
    {
      provide: PUSH_SUBSCRIPTION_REPOSITORY_TOKEN,
      useClass: TypeOrmPushSubscriptionRepository,
    },
    {
      provide: NOTIFICATION_REPOSITORY_TOKEN,
      useClass: TypeOrmNotificationRepository,
    },
  ],
  exports: [
    NotifySubscribersUseCase,
    NotifyUserUseCase,
    GetNotificationsUseCase,
  ],
})
export class NotificationsModule {}
