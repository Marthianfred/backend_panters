import { Injectable, Inject } from '@nestjs/common';
import type { 
  IRefundGiftRepository, 
} from './interfaces/refund-gift.repository.interface';
import { REFUND_GIFT_REPOSITORY } from './interfaces/refund-gift.repository.interface';
import {
  RefundGiftRequest,
  RefundGiftResponse,
  TransactionNotFoundError,
  RefundFailedError,
} from './refund-gift.models';

@Injectable()
export class RefundGiftHandler {
  constructor(
    @Inject(REFUND_GIFT_REPOSITORY)
    private readonly repository: IRefundGiftRepository,
  ) {}

  public async execute(request: RefundGiftRequest): Promise<RefundGiftResponse> {
    const result = await this.repository.processRefundTransaction(
      request.transactionId,
      request.reason,
    );

    if (!result) {
      throw new TransactionNotFoundError(request.transactionId);
    }

    return {
      refundTransactionId: result.refundTransactionId,
      newBalance: result.newBalance,
    };
  }
}
