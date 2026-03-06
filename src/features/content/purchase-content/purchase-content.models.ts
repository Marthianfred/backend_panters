export interface PurchaseContentRequest {
  subscriberId: string;
  contentId: string;
}

export interface PurchaseContentResponse {
  success: boolean;
  message: string;
  signedDeliveryUrl?: string;
}

export class ContentNotFoundError extends Error {
  constructor() {
    super('El contenido solicitado no existe.');
    this.name = 'ContentNotFoundError';
  }
}

export class InsufficientCoinsError extends Error {
  constructor() {
    super('No possee suficientes Panter Coins para desbloquear esto.');
    this.name = 'InsufficientCoinsError';
  }
}
