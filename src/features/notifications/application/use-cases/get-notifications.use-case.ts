import { Injectable, Inject } from '@nestjs/common';
import { NOTIFICATION_REPOSITORY_TOKEN } from '../../domain/notification.repository';
import type { NotificationRepository } from '../../domain/notification.repository';
import type { Notification } from '../../domain/notification.entity';

@Injectable()
export class GetNotificationsUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY_TOKEN)
    private readonly repository: NotificationRepository,
  ) {}

  async execute(userId: string, onlyUnread: boolean = false): Promise<Notification[]> {
    return this.repository.findByUserId(userId, onlyUnread);
  }
}
