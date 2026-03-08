export interface GiftDTO {
  id: string;
  name: string;
  priceCoins: number;
  icon: string;
  animationUrl?: string;
}

export interface ListGiftsResponse {
  gifts: GiftDTO[];
}
