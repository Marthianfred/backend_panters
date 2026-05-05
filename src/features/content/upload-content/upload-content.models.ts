import { BadRequestException, NotFoundException } from '@nestjs/common';

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

export class InvalidPriceError extends BadRequestException {
  constructor() {
    super('El precio debe ser mayor o igual a cero.');
  }
}

export class ProfileNotFoundError extends NotFoundException {
  constructor() {
    super('No se encontró un perfil asociado para esta modelo.');
  }
}
