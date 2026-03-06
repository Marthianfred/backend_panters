import { Wallet } from '../webhooks-top-up.models';

export const WALLET_REPOSITORY_TOKEN = Symbol('WALLET_REPOSITORY_TOKEN');

export interface IWalletRepository {
  creditCoinsToUser(
    userId: string,
    amount: number,
    referenceId: string,
  ): Promise<Wallet>;
}
