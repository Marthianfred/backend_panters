import { Injectable } from '@nestjs/common';
import { IWalletRepository } from '../interfaces/wallet.repository.interface';
import { Wallet } from '../webhooks-top-up.models';

@Injectable()
export class InMemoryWalletRepository implements IWalletRepository {
  private wallets: Map<string, Wallet> = new Map();
  private processedTransactions: Set<string> = new Set();

  public async creditCoinsToUser(
    userId: string,
    amount: number,
    referenceId: string,
  ): Promise<Wallet> {
    if (this.processedTransactions.has(referenceId)) {
      return this.wallets.get(userId) || this.createEmptyWallet(userId);
    }

    let wallet = this.wallets.get(userId);

    if (!wallet) {
      wallet = this.createEmptyWallet(userId);
    }

    wallet.balance += amount;
    wallet.lastUpdate = new Date();

    this.wallets.set(userId, wallet);
    this.processedTransactions.add(referenceId);

    return wallet;
  }

  private createEmptyWallet(userId: string): Wallet {
    return {
      walletId: `wallet_${Date.now()}`,
      userId: userId,
      balance: 0,
      lastUpdate: new Date(),
    };
  }
}
