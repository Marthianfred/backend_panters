import { Module } from '@nestjs/common';
import { GetPlatformRevenueController } from '@/features/reports/get-platform-revenue/get-platform-revenue.controller';
import { GetPlatformRevenueHandler } from '@/features/reports/get-platform-revenue/get-platform-revenue.handler';
import { PostgresPlatformRevenueRepository } from '@/features/reports/get-platform-revenue/infrastructure/postgres-platform-revenue.repository';

import { GetPlatformSummaryController } from '@/features/reports/get-platform-summary/get-platform-summary.controller';
import { GetPlatformSummaryHandler } from '@/features/reports/get-platform-summary/get-platform-summary.handler';
import { PostgresPlatformSummaryRepository } from '@/features/reports/get-platform-summary/infrastructure/postgres-platform-summary.repository';

@Module({
  controllers: [
    GetPlatformRevenueController,
    GetPlatformSummaryController,
  ],
  providers: [
    GetPlatformRevenueHandler,
    GetPlatformSummaryHandler,
    {
      provide: 'IPlatformRevenueRepository',
      useClass: PostgresPlatformRevenueRepository,
    },
    {
      provide: 'IPlatformSummaryRepository',
      useClass: PostgresPlatformSummaryRepository,
    },
  ],
})
export class ReportsModule {}
