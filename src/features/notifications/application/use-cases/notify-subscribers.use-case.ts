import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PUSH_SUBSCRIPTION_REPOSITORY_TOKEN } from '../../domain/push-subscription.repository';
import type { PushSubscriptionRepository } from '../../domain/push-subscription.repository';
import { NOTIFICATION_REPOSITORY_TOKEN } from '../../domain/notification.repository';
import type { NotificationRepository } from '../../domain/notification.repository';
import { Notification } from '../../domain/notification.entity';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class NotifySubscribersUseCase {
  private readonly logger = new Logger(NotifySubscribersUseCase.name);

  constructor(
    @Inject(PUSH_SUBSCRIPTION_REPOSITORY_TOKEN)
    private readonly pushRepository: PushSubscriptionRepository,
    @Inject(NOTIFICATION_REPOSITORY_TOKEN)
    private readonly notificationRepository: NotificationRepository,
    private readonly configService: ConfigService,
  ) {
    const publicKey = this.configService.getOrThrow<string>('VAPID_PUBLIC_KEY');
    const privateKey =
      this.configService.getOrThrow<string>('VAPID_PRIVATE_KEY');
    const subject = this.configService.getOrThrow<string>('VAPID_SUBJECT');

    webpush.setVapidDetails(subject, publicKey, privateKey);
  }

  async execute(
    payload: NotificationPayload,
  ): Promise<{ success: number; failed: number }> {
    const subscribers = await this.pushRepository.findByRole('subscriber');
    this.logger.log(
      `Iniciando envío de notificación a ${subscribers.length} suscriptores`,
    );

    const notifications = subscribers.map((sub) =>
      Notification.create({
        userId: sub.userId,
        title: payload.title,
        body: payload.body,
        data: payload.data,
      }),
    );
    await this.notificationRepository.saveMany(notifications);

    let successCount = 0;
    let failedCount = 0;

    const notificationPromise = subscribers.map(async (sub) => {
      try {
        const pushSubscription: webpush.PushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(payload),
        );
        successCount++;
      } catch (error: unknown) {
        failedCount++;
        this.logger.error(
          `Error enviando notificación a endpoint: ${sub.endpoint}`,
          error,
        );

        interface WebPushError {
          statusCode: number;
        }

        if (error && typeof error === 'object' && 'statusCode' in error) {
          const statusCode = (error as WebPushError).statusCode;
          if (statusCode === 410 || statusCode === 404) {
            await this.pushRepository.deleteByEndpoint(sub.endpoint);
          }
        }
      }
    });

    await Promise.all(notificationPromise);

    return { success: successCount, failed: failedCount };
  }
}
