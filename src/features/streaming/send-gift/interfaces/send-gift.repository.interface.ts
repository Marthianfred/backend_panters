export interface GiftDefinition {
  id: string;
  name: string;
  priceCoins: number;
  iconUrl: string;
}

export interface ISendGiftRepository {
  getGiftById(giftId: string): Promise<GiftDefinition | null>;
  
  
  userExists(userId: string): Promise<boolean>;
  
  
  processGiftTransaction(
    userId: string,
    creatorId: string,
    gift: GiftDefinition,
  ): Promise<{ transactionId: string; remainingBalance: number } | null>;
}

export const SEND_GIFT_REPOSITORY = Symbol('SEND_GIFT_REPOSITORY');
