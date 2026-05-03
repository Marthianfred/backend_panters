export interface IPlatformSummaryRepository {
  getActiveSubscribersCount(): Promise<number>;
  getNewUsersCount(startDate?: Date, endDate?: Date): Promise<number>;
  getFinancialStatsPerModel(startDate?: Date, endDate?: Date): Promise<Array<{
    creatorId: string;
    creatorName: string;
    totalEarnedPtc: number;
  }>>;
}
