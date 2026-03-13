import { Injectable, Inject } from '@nestjs/common';
import type { IContentRepository } from '../interfaces/content.repository.interface';
import { CONTENT_REPOSITORY_TOKEN } from '../interfaces/content.repository.interface';
import { CONTENT_STORAGE_SERVICE } from '../upload-content/interfaces/content-storage.service.interface';
import type { IContentStorageService } from '../upload-content/interfaces/content-storage.service.interface';
import {
  GetMediaUrlRequest,
  GetMediaUrlResponse,
  ContentAccessDeniedError,
  ContentNotFoundError,
} from './get-media-url.models';

@Injectable()
export class GetMediaUrlHandler {
  constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly contentRepository: IContentRepository,
    @Inject(CONTENT_STORAGE_SERVICE)
    private readonly storageService: IContentStorageService,
  ) {}

  public async execute(
    request: GetMediaUrlRequest,
  ): Promise<GetMediaUrlResponse> {
    // 1. Obtener el contenido de la base de datos
    const content = await this.contentRepository.getContentById(request.contentId);

    if (!content) {
      throw new ContentNotFoundError();
    }

    // 2. Validar acceso (Lógica de "Middleware" de negocio)
    // El acceso se permite si: es free, el usuario lo compró, o el usuario es el creador
    const isOwner = content.creatorId === request.subscriberId;
    
    let hasPurchased = false;
    if (!isOwner && content.accessType !== 'free') {
       const purchasedIds = await this.contentRepository.getPurchasedContentIds(request.subscriberId);
       hasPurchased = purchasedIds.includes(content.id);
    }

    const canView = content.accessType === 'free' || isOwner || hasPurchased;

    if (!canView) {
      throw new ContentAccessDeniedError();
    }

    // 3. Generar la URL firmada de S3 para el medio completo
    const extension = content.url.substring(content.url.lastIndexOf('.'));
    const mediaUrl = await this.storageService.getPresignedDownloadUrl(
      content.creatorId,
      content.id,
      extension,
      'content',
    );

    return {
      mediaUrl,
      type: content.type,
    };
  }
}
