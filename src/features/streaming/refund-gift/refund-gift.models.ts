export class TransactionNotFoundError extends Error {
  constructor(public readonly transactionId: string) {
    super(`Transacción no encontrada: ${transactionId}`);
    this.name = 'TransactionNotFoundError';
  }
}

export class RefundAlreadyProcessedError extends Error {
  constructor(public readonly transactionId: string) {
    super(`El reembolso ya ha sido procesado para la transacción: ${transactionId}`);
    this.name = 'RefundAlreadyProcessedError';
  }
}

export class RefundFailedError extends Error {
  constructor(public readonly message: string) {
    super(`Fallo al procesar el reembolso: ${message}`);
    this.name = 'RefundFailedError';
  }
}

export interface RefundGiftRequest {
  transactionId: string;
  reason?: string;
}

export interface RefundGiftResponse {
  refundTransactionId: string;
  newBalance: number;
}
