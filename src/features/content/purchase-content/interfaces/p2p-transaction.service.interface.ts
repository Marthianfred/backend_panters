export const P2P_TRANSACTION_SERVICE_TOKEN = Symbol(
  'P2P_TRANSACTION_SERVICE_TOKEN',
);

export interface IP2PTransactionService {
  executeContentPurchase(
    subscriberId: string,
    creatorId: string,
    contentId: string,
    amountInCoins: number,
  ): Promise<boolean>;
}
