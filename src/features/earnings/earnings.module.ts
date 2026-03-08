import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GetEarningsSummaryController } from './get-earnings-summary/get-earnings-summary.controller';
import { GetEarningsSummaryHandler } from './get-earnings-summary/get-earnings-summary.handler';
import { GetEarningsHistoryController } from './get-earnings-history/get-earnings-history.controller';
import { GetEarningsHistoryHandler } from './get-earnings-history/get-earnings-history.handler';
import { EARNINGS_REPOSITORY_TOKEN } from './interfaces/earnings.repository.interface';
import { PostgresEarningsRepository } from './infrastructure/postgres.earnings.repository';

@Module({
  imports: [AuthModule],
  controllers: [
    GetEarningsSummaryController,
    GetEarningsHistoryController
  ],
  providers: [
    GetEarningsSummaryHandler,
    GetEarningsHistoryHandler,
    {
      provide: EARNINGS_REPOSITORY_TOKEN,
      useClass: PostgresEarningsRepository,
    },
  ],
  exports: [
    GetEarningsSummaryHandler,
    GetEarningsHistoryHandler
  ],
})
export class EarningsModule {}
