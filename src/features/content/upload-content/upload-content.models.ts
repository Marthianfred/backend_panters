export interface UploadContentRequest {
  creatorId: string;
  title: string;
  description: string;
  priceInPanterCoins: number;
  type?: string;
  mimeType: string;
  thumbnailMimeType?: string; 
  accessType: string; 
}

export interface UploadContentResponse {
  contentId: string;
  status: string;
  message: string;
  presignedUploadUrl: string; 
  presignedThumbnailUploadUrl?: string; 
}

export class InvalidPriceError extends Error {
  constructor() {
    super('El precio en Panter Coins debe ser mayor o igual a cero.');
    this.name = 'InvalidPriceError';
  }
}
