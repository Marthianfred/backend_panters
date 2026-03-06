export const WALLET_REPOSITORY = Symbol('IWalletRepository');

export interface WalletData {
  userId: string;
  panterCoinBalance: number;
  lastUpdated: Date;
}

export interface IWalletRepository {
  getWalletByUserId(userId: string): Promise<WalletData | null>;
}
