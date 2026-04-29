import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as userSubscriptionsRepositoryInterface from '@/features/subscriptions/interfaces/user.subscriptions.repository.interface';

@Injectable()
export class CheckExpiredSubscriptionsTask {
  private readonly logger = new Logger(CheckExpiredSubscriptionsTask.name);

  constructor(
    @Inject(userSubscriptionsRepositoryInterface.USER_SUBSCRIPTIONS_REPOSITORY)
    private readonly userSubscriptionsRepository: userSubscriptionsRepositoryInterface.IUserSubscriptionsRepository,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    this.logger.log('Iniciando tarea automática de verificación de suscripciones expiradas...');

    try {
      const now = new Date();
      const expiredCount = await this.userSubscriptionsRepository.markExpiredSubscriptions(now);

      if (expiredCount > 0) {
        this.logger.log(`Se han marcado ${expiredCount} suscripciones como expiradas exitosamente.`);
      } else {
        this.logger.log('No se encontraron suscripciones por expirar en este ciclo.');
      }
    } catch (error) {
      this.logger.error(`Error durante la verificación de suscripciones: ${error.message}`);
    }
  }
}
