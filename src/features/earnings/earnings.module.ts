import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GetEarningsSummaryController } from './get-earnings-summary/get-earnings-summary.controller';
import { GetEarningsSummaryHandler } from './get-earnings-summary/get-earnings-summary.handler';
import { EARNINGS_REPOSITORY_TOKEN } from './interfaces/earnings.repository.interface';
import { PostgresEarningsRepository } from './infrastructure/postgres.earnings.repository';

@Module({
  imports: [AuthModule],
  controllers: [GetEarningsSummaryController],
  providers: [
    GetEarningsSummaryHandler,
    {
      provide: EARNINGS_REPOSITORY_TOKEN,
      useClass: PostgresEarningsRepository,
    },
  ],
  exports: [GetEarningsSummaryHandler],
})
export class EarningsModule {}
