export interface Wallet {
  walletId: string;
  userId: string;
  balance: number;
  lastUpdate: Date;
}

export interface WebhookResponse {
  success: boolean;
  message: string;
}

export interface StripeWebhookPayload {
  id: string;
  type: string;
  data: {
    object: {
      metadata: {
        userId: string;
        coinsAmount: string;
      };
      status: string;
    };
  };
}

export interface BinanceWebhookPayload {
  bizId: string;
  bizStatus: string;
  data: string;
  metadata: {
    userId: string;
    coinsAmount: string;
  };
}

export class InvalidSignatureError extends Error {
  constructor() {
    super('La firma del webhook es inválida o no autorizada.');
    this.name = 'InvalidSignatureError';
  }
}
