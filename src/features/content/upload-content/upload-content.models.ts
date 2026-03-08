export interface UploadContentRequest {
  creatorId: string;
  title: string;
  description: string;
  priceInPanterCoins: number;
  type?: string;
}

export interface UploadContentResponse {
  contentId: string;
  status: string;
  message: string;
  presignedUploadUrl: string; // Para subir el MP4 directo a S3
}

export class InvalidPriceError extends Error {
  constructor() {
    super('El precio en Panter Coins debe ser mayor o igual a cero.');
    this.name = 'InvalidPriceError';
  }
}
