export interface EarningsSummaryResponse {
  totalEarned: number;
  platformCommission: number;
  netBalance: number;
  totalSalesCount: number;
  recentSales: SaleTransactionDTO[];
}

export interface SaleTransactionDTO {
  id: string;
  contentTitle: string;
  buyerName: string;
  amount: number;
  date: Date;
}
