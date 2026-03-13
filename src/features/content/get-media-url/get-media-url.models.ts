export interface GetMediaUrlRequest {
  contentId: string;
  subscriberId: string;
}

export interface GetMediaUrlResponse {
  mediaUrl: string;
  type: string;
}

export class ContentAccessDeniedError extends Error {
  constructor() {
    super('No tienes acceso a este contenido. Por favor, realiza la compra primero.');
    this.name = 'ContentAccessDeniedError';
  }
}

export class ContentNotFoundError extends Error {
  constructor() {
    super('El contenido solicitado no existe.');
    this.name = 'ContentNotFoundError';
  }
}
