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
  clientId?: string;
}

export interface UploadProgressData {
  status: 'starting' | 'saving_db' | 'uploading_s3' | 'completed' | 'error';
  progress: number;
  message: string;
  data?: any;
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
