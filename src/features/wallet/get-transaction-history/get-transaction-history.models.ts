export interface TransactionData {
  id: string;
  type: string;
  amount: number;
  description: string;
  referenceId: string;
  createdAt: Date;
}

export interface GetTransactionHistoryRequest {
  userId: string;
  page: number;
}

export interface GetTransactionHistoryResponse {
  transactions: TransactionData[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
