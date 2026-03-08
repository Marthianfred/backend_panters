export interface IRefundGiftRepository {
  /**
   * Ejecuta la transacción atómica de reembolso:
   * 1. Verifica la transacción original.
   * 2. Revierte el balance del usuario.
   * 3. Revierte el balance de la creadora (split 70/30).
   * 4. Registra la transacción de crédito de reembolso.
   * @returns El nuevo saldo y el ID de transacción de reembolso.
   */
  processRefundTransaction(
    transactionId: string,
    reason?: string,
  ): Promise<{ refundTransactionId: string; newBalance: number } | null>;
}

export const REFUND_GIFT_REPOSITORY = Symbol('REFUND_GIFT_REPOSITORY');
