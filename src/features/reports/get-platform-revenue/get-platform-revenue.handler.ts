import { Inject, Injectable } from '@nestjs/common';
import type { IPlatformRevenueRepository } from './interfaces/platform-revenue-repository.interface';
import { PlatformRevenueResponseDto, GetPlatformRevenueQueryDto } from './get-platform-revenue.models';

@Injectable()
export class GetPlatformRevenueHandler {
  private readonly PTC_TO_USD_RATE = 0.1;

  constructor(
    @Inject('IPlatformRevenueRepository')
    private readonly repository: IPlatformRevenueRepository,
  ) {}

  async execute(queryDto: GetPlatformRevenueQueryDto): Promise<PlatformRevenueResponseDto> {
    const startDate = queryDto.startDate ? new Date(queryDto.startDate) : undefined;
    const endDate = queryDto.endDate ? new Date(queryDto.endDate) : undefined;

    const metrics = await this.repository.getRevenueMetrics(startDate, endDate);

    return {
      grossRevenue: {
        ptc: metrics.totalGrossPtc,
        usd: this.convertToUsd(metrics.totalGrossPtc),
      },
      platformCommission: {
        ptc: metrics.totalPlatformPtc,
        usd: this.convertToUsd(metrics.totalPlatformPtc),
      },
      creatorEarnings: {
        ptc: metrics.totalCreatorPtc,
        usd: this.convertToUsd(metrics.totalCreatorPtc),
      },
      subscriptionRevenue: {
        ptc: metrics.totalSubscriptionUsd * 10,
        usd: metrics.totalSubscriptionUsd,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  private convertToUsd(ptcAmount: number): number {
    return parseFloat((ptcAmount * this.PTC_TO_USD_RATE).toFixed(2));
  }
}
