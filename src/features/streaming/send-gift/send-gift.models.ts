export class GiftNotFoundError extends Error {
  constructor(public readonly giftId: string) {
    super(`Regalo no encontrado: ${giftId}`);
    this.name = 'GiftNotFoundError';
  }
}

export class InsufficientBalanceError extends Error {
  constructor(public readonly userId: string) {
    super(`Saldo insuficiente para el usuario: ${userId}`);
    this.name = 'InsufficientBalanceError';
  }
}

export class SendGiftFailedError extends Error {
  constructor(public readonly message: string) {
    super(`Fallo al enviar el regalo: ${message}`);
    this.name = 'SendGiftFailedError';
  }
}

export interface SendGiftRequest {
  userId: string;
  creatorId: string;
  giftId: string;
}

export interface SendGiftResponse {
  transactionId: string;
  remainingBalance: number;
}
