export interface EarningsHistoryRequest {
  creatorId: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface EarningTransactionDTO {
  id: string;
  type: 'CONTENT_SALE' | 'GIFT' | 'VIDEO_CALL';
  description: string;
  grossAmount: number;
  netAmount: number; // El 70%
  platformFee: number; // El 30%
  date: Date;
  buyerName: string;
}

export interface EarningsHistoryResponse {
  transactions: EarningTransactionDTO[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}
