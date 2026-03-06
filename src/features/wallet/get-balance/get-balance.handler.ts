import { Injectable, Inject } from '@nestjs/common';
import type { IWalletRepository } from './interfaces/wallet.repository.interface';
import { WALLET_REPOSITORY } from './interfaces/wallet.repository.interface';
import type {
  GetBalanceRequest,
  GetBalanceResponse,
} from './get-balance.models';
import { WalletNotFoundError } from './get-balance.models';

@Injectable()
export class GetBalanceHandler {
  constructor(
    @Inject(WALLET_REPOSITORY)
    private readonly walletRepository: IWalletRepository,
  ) {}

  public async execute(
    request: GetBalanceRequest,
  ): Promise<GetBalanceResponse> {
    const walletData = await this.walletRepository.getWalletByUserId(
      request.userId,
    );

    if (!walletData) {
      throw new WalletNotFoundError(request.userId);
    }

    // Adaptación DTO
    return {
      balance: walletData.panterCoinBalance,
      currency: 'PTC', // Panter Coin Iso Code
      lastUpdated: walletData.lastUpdated,
    };
  }
}
