export interface GetBalanceRequest {
  userId: string;
}

export interface GetBalanceResponse {
  balance: number;
  currency: string;
  lastUpdated: Date;
}

export class WalletNotFoundError extends Error {
  constructor(userId: string) {
    super(`No se encontró una wallet de Panter Coin para el usuario ${userId}`);
    this.name = 'WalletNotFoundError';
  }
}
