import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PUSH_SUBSCRIPTION_REPOSITORY_TOKEN } from '../../domain/push-subscription.repository';
import type { PushSubscriptionRepository } from '../../domain/push-subscription.repository';
import { NOTIFICATION_REPOSITORY_TOKEN } from '../../domain/notification.repository';
import type { NotificationRepository } from '../../domain/notification.repository';
import { Notification } from '../../domain/notification.entity';
import type { NotificationPayload } from './notify-subscribers.use-case';

@Injectable()
export class NotifyUserUseCase {
  private readonly logger = new Logger(NotifyUserUseCase.name);

  constructor(
    @Inject(PUSH_SUBSCRIPTION_REPOSITORY_TOKEN)
    private readonly pushRepository: PushSubscriptionRepository,
    @Inject(NOTIFICATION_REPOSITORY_TOKEN)
    private readonly notificationRepository: NotificationRepository,
    private readonly configService: ConfigService,
  ) {
    
    if (!this.configService.get('VAPID_PUBLIC_KEY')) return;
    
    const publicKey = this.configService.getOrThrow<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.configService.getOrThrow<string>('VAPID_PRIVATE_KEY');
    const subject = this.configService.getOrThrow<string>('VAPID_SUBJECT');

    webpush.setVapidDetails(subject, publicKey, privateKey);
  }

  async execute(userId: string, payload: NotificationPayload): Promise<void> {
    
    const notification = Notification.create({
      userId,
      title: payload.title,
      body: payload.body,
      data: payload.data,
    });
    await this.notificationRepository.save(notification);

    
    const subscriptions = await this.pushRepository.findByUserId(userId);
    
    if (subscriptions.length === 0) {
      this.logger.debug(`Usuario ${userId} no tiene suscripciones push activas.`);
      return;
    }

    const notificationPromises = subscriptions.map(async (sub) => {
      try {
        const pushSubscription: webpush.PushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
      } catch (error) {
        this.logger.error(`Error enviando notificación push a usuario ${userId}:`, error);
        
        if (error.statusCode === 410 || error.statusCode === 404) {
          await this.pushRepository.deleteByEndpoint(sub.endpoint);
        }
      }
    });

    await Promise.all(notificationPromises);
  }
}
