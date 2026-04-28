import { Injectable, Inject } from '@nestjs/common';
import type { ITransactionRepository } from './interfaces/transaction.repository.interface';
import { TRANSACTION_REPOSITORY } from './interfaces/transaction.repository.interface';
import type {
  GetTransactionHistoryRequest,
  GetTransactionHistoryResponse,
} from './get-transaction-history.models';

@Injectable()
export class GetTransactionHistoryHandler {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  public async execute(
    request: GetTransactionHistoryRequest,
  ): Promise<GetTransactionHistoryResponse> {
    const limit = 10; 
    const { transactions, total } = await this.transactionRepository.getTransactionsByUserId(
      request.userId,
      request.page,
      limit,
    );

    return {
      transactions,
      meta: {
        total,
        page: request.page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
