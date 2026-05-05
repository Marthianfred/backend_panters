import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PushSubscriptionRepository } from '../../domain/push-subscription.repository';
import { PushSubscription } from '../../domain/push-subscription.entity';
import { PushSubscriptionOrmEntity } from './push-subscription.orm-entity';

@Injectable()
export class TypeOrmPushSubscriptionRepository implements PushSubscriptionRepository {
  constructor(
    @InjectRepository(PushSubscriptionOrmEntity)
    private readonly repository: Repository<PushSubscriptionOrmEntity>,
  ) {}

  async save(subscription: PushSubscription): Promise<void> {
    const ormEntity = this.repository.create({
      userId: subscription.userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    });

    await this.repository.upsert(ormEntity, ['userId', 'endpoint']);
  }

  async findByUserId(userId: string): Promise<PushSubscription[]> {
    const entities = await this.repository.find({ where: { userId } });
    return entities.map(this.toDomain);
  }

  async findByRole(role: string): Promise<PushSubscription[]> {
    const entities = await this.repository
      .createQueryBuilder('sub')
      .innerJoin('user', 'u', 'u.id = sub.user_id')
      .where('u.role = :role', { role })
      .getMany();

    return entities.map(this.toDomain);
  }

  async deleteByEndpoint(endpoint: string): Promise<void> {
    await this.repository.delete({ endpoint });
  }

  private toDomain(entity: PushSubscriptionOrmEntity): PushSubscription {
    return new PushSubscription(
      entity.id,
      entity.userId,
      entity.endpoint,
      entity.p256dh,
      entity.auth,
      entity.createdAt,
      entity.updatedAt,
    );
  }
}
