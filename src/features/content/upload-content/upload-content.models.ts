export interface UploadContentRequest {
  creatorId: string;
  title: string;
  description: string;
  priceInPanterCoins: number;
  type?: string;
  mimeType: string;
  thumbnailMimeType?: string; // Nuevo campo para la miniatura
  accessType: string; // 'free' | 'payment'
}

export interface UploadContentResponse {
  contentId: string;
  status: string;
  message: string;
  presignedUploadUrl: string; // URL para el video/foto principal
  presignedThumbnailUploadUrl?: string; // Nueva URL para la miniatura
}

export class InvalidPriceError extends Error {
  constructor() {
    super('El precio en Panter Coins debe ser mayor o igual a cero.');
    this.name = 'InvalidPriceError';
  }
}
