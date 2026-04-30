import type { Notification } from './notification.entity';

export const NOTIFICATION_REPOSITORY_TOKEN = 'NOTIFICATION_REPOSITORY_TOKEN';

export interface NotificationRepository {
  save(notification: Notification): Promise<void>;
  saveMany(notifications: Notification[]): Promise<void>;
  findByUserId(userId: string, onlyUnread: boolean): Promise<Notification[]>;
  markAsRead(id: string): Promise<void>;
}
