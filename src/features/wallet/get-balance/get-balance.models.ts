import { NotFoundException } from '@nestjs/common';

export interface GetBalanceRequest {
  userId: string;
}

export interface GetBalanceResponse {
  balance: number;
  currency: string;
  lastUpdated: Date;
}

export class WalletNotFoundError extends NotFoundException {
  constructor(userId: string) {
    super(
      `No se encontró una billetera de Panter Coin para el usuario ${userId}`,
    );
  }
}
