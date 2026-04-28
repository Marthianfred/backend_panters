import { Injectable, Inject } from '@nestjs/common';
import * as crypto from 'crypto';
import type { IContentRepository } from '../interfaces/content.repository.interface';
import { CONTENT_REPOSITORY_TOKEN } from '../interfaces/content.repository.interface';
import type { IContentStorageService } from './interfaces/content-storage.service.interface';
import { CONTENT_STORAGE_SERVICE } from './interfaces/content-storage.service.interface';
import { PROFILE_REPOSITORY } from '@/features/profiles/get-profile/interfaces/profile.repository.interface';
import type { IProfileRepository } from '@/features/profiles/get-profile/interfaces/profile.repository.interface';
import type {
  UploadContentRequest,
  UploadContentResponse,
} from './upload-content.models';
import { InvalidPriceError } from './upload-content.models';

@Injectable()
export class UploadContentHandler {
  constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly contentRepository: IContentRepository,
    @Inject(CONTENT_STORAGE_SERVICE)
    private readonly storageService: IContentStorageService,
    @Inject(PROFILE_REPOSITORY)
    private readonly profileRepository: IProfileRepository,
  ) {}

  public async execute(
    request: UploadContentRequest,
  ): Promise<UploadContentResponse> {
    if (request.priceInPanterCoins < 0) {
      throw new InvalidPriceError();
    }

    
    const profile = await this.profileRepository.getProfileByUserId(request.creatorId);
    if (!profile) {
      throw new Error('No se encontró un perfil asociado para esta creadora (Panter).');
    }

    const contentId = crypto.randomUUID();

    const extension = this.getExtension(request.mimeType);
    const mediaKey = `${request.creatorId}/content/${contentId}${extension}`;
    
    let thumbnailKey = '';
    let presignedThumbnailUploadUrl: string | undefined = undefined;

    if (request.thumbnailMimeType) {
      const thumbExt = this.getExtension(request.thumbnailMimeType);
      thumbnailKey = `${request.creatorId}/thumbnails/${contentId}${thumbExt}`;
      
      presignedThumbnailUploadUrl = await this.storageService.getPresignedUploadUrl(
        request.creatorId,
        contentId, 
        request.thumbnailMimeType,
        'thumbnails'
      );
      
      
      
      
    }

    
    await this.contentRepository.saveContent({
      id: contentId,
      creatorId: request.creatorId,
      title: request.title,
      description: request.description,
      type: request.type || (request.mimeType.startsWith('image/') ? 'photo' : 'video'),
      price: request.priceInPanterCoins,
      accessType: request.accessType,
      url: mediaKey,
      thumbnailUrl: thumbnailKey,
      createdAt: new Date(),
    });

    
    const presignedUploadUrl = await this.storageService.getPresignedUploadUrl(
      request.creatorId,
      contentId,
      request.mimeType,
    );

    return {
      contentId,
      status: 'AWAITING_MEDIA',
      message:
        'Los metadatos fueron creados. Proceda a subir el archivo y la miniatura mediante las URLs provistas.',
      presignedUploadUrl,
      presignedThumbnailUploadUrl,
    };
  }

  private getExtension(mimeType: string): string {
    const mime = mimeType.toLowerCase();
    if (mime.includes('image/jpeg') || mime.includes('image/jpg')) return '.jpg';
    if (mime.includes('image/png')) return '.png';
    if (mime.includes('image/gif')) return '.gif';
    if (mime.includes('image/webp')) return '.webp';
    if (mime.includes('video/mp4')) return '.mp4';
    if (mime.includes('video/quicktime')) return '.mov';
    return '.mp4';
  }
}
