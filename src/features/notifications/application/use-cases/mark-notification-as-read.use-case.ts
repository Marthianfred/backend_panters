import { Injectable, Inject } from '@nestjs/common';
import { NOTIFICATION_REPOSITORY_TOKEN } from '../../domain/notification.repository';
import type { NotificationRepository } from '../../domain/notification.repository';

@Injectable()
export class MarkNotificationAsReadUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY_TOKEN)
    private readonly repository: NotificationRepository,
  ) {}

  async execute(notificationId: string): Promise<void> {
    await this.repository.markAsRead(notificationId);
  }
}
