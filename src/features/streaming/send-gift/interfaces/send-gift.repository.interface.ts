export interface GiftDefinition {
  id: string;
  name: string;
  priceCoins: number;
  iconUrl: string;
}

export interface ISendGiftRepository {
  getGiftById(giftId: string): Promise<GiftDefinition | null>;
  
  /**
   * Verifica si un usuario existe en el sistema.
   */
  userExists(userId: string): Promise<boolean>;
  
  /**
   * Ejecuta la transacción atómica de envío de regalo:
   * 1. Verifica saldo.
   * 2. Deduce del balance del usuario.
   * 3. Reparte 70% a creator_wallet y 30% a plataforma.
   * 4. Registra gift_transactions.
   * @returns El nuevo saldo y el ID de transacción.
   */
  processGiftTransaction(
    userId: string,
    creatorId: string,
    gift: GiftDefinition,
  ): Promise<{ transactionId: string; remainingBalance: number } | null>;
}

export const SEND_GIFT_REPOSITORY = Symbol('SEND_GIFT_REPOSITORY');
