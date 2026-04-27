import { TransactionData } from '../get-transaction-history.models';

export const TRANSACTION_REPOSITORY = 'TRANSACTION_REPOSITORY';

export interface ITransactionRepository {
  getTransactionsByUserId(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ transactions: TransactionData[]; total: number }>;
}
