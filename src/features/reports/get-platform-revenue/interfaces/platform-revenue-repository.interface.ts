export interface IPlatformRevenueRepository {
  getRevenueMetrics(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{
    totalGrossPtc: number;
    totalPlatformPtc: number;
    totalCreatorPtc: number;
    totalSubscriptionUsd: number;
  }>;
}
