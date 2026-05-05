import { Inject, Injectable } from '@nestjs/common';
import type { IPlatformSummaryRepository } from './interfaces/platform-summary-repository.interface';
import {
  PlatformSummaryResponseDto,
  GetPlatformSummaryQueryDto,
} from './get-platform-summary.models';

@Injectable()
export class GetPlatformSummaryHandler {
  private readonly PTC_TO_USD_RATE = 0.1;

  constructor(
    @Inject('IPlatformSummaryRepository')
    private readonly repository: IPlatformSummaryRepository,
  ) {}

  async execute(
    queryDto: GetPlatformSummaryQueryDto,
  ): Promise<PlatformSummaryResponseDto> {
    const startDate = queryDto.startDate
      ? new Date(queryDto.startDate)
      : undefined;
    const endDate = queryDto.endDate ? new Date(queryDto.endDate) : undefined;

    const [totalSubscribers, newUsersCount, modelStats] = await Promise.all([
      this.repository.getActiveSubscribersCount(),
      this.repository.getNewUsersCount(startDate, endDate),
      this.repository.getFinancialStatsPerModel(startDate, endDate),
    ]);

    return {
      totalSubscribers,
      newUsersCount,
      topModelsByRevenue: modelStats.map((stat) => ({
        ...stat,
        totalEarnedUsd: parseFloat(
          (stat.totalEarnedPtc * this.PTC_TO_USD_RATE).toFixed(2),
        ),
      })),
      generatedAt: new Date().toISOString(),
    };
  }
}
