import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { NotificationRepository } from '../../domain/notification.repository';
import { Notification } from '../../domain/notification.entity';
import { NotificationOrmEntity } from './notification.orm-entity';

@Injectable()
export class TypeOrmNotificationRepository implements NotificationRepository {
  constructor(
    @InjectRepository(NotificationOrmEntity)
    private readonly repository: Repository<NotificationOrmEntity>,
  ) {}

  async save(notification: Notification): Promise<void> {
    const ormEntity = this.repository.create({
      userId: notification.userId,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      isRead: notification.isRead,
    });
    await this.repository.save(ormEntity);
  }

  async saveMany(notifications: Notification[]): Promise<void> {
    const ormEntities = notifications.map(n => this.repository.create({
      userId: n.userId,
      title: n.title,
      body: n.body,
      data: n.data,
      isRead: n.isRead,
    }));
    await this.repository.save(ormEntities);
  }

  async findByUserId(userId: string, onlyUnread: boolean): Promise<Notification[]> {
    const where: any = { userId };
    if (onlyUnread) {
      where.isRead = false;
    }
    
    const entities = await this.repository.find({
      where,
      order: { createdAt: 'DESC' },
    });

    return entities.map(entity => new Notification(
      entity.id,
      entity.userId,
      entity.title,
      entity.body,
      entity.data,
      entity.isRead,
      entity.createdAt,
    ));
  }

  async markAsRead(id: string): Promise<void> {
    await this.repository.update(id, { isRead: true });
  }
}
