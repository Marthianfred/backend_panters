export interface IRefundGiftRepository {
  
  processRefundTransaction(
    transactionId: string,
    reason?: string,
  ): Promise<{ refundTransactionId: string; newBalance: number } | null>;
}

export const REFUND_GIFT_REPOSITORY = Symbol('REFUND_GIFT_REPOSITORY');
