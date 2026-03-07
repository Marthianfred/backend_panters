import { Injectable, Inject } from '@nestjs/common';
import type { IContentRepository } from '../interfaces/content.repository.interface';
import { CONTENT_REPOSITORY_TOKEN } from '../interfaces/content.repository.interface';
import type { IContentStorageService } from './interfaces/content-storage.service.interface';
import { CONTENT_STORAGE_SERVICE } from './interfaces/content-storage.service.interface';
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
  ) {}

  public async execute(
    request: UploadContentRequest,
  ): Promise<UploadContentResponse> {
    if (request.priceInPanterCoins < 0) {
      throw new InvalidPriceError();
    }

    const contentId = `content_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Guardamos metadata en BDD
    await this.contentRepository.saveContent({
      id: contentId,
      creatorId: request.creatorId,
      title: request.title,
      description: request.description,
      price: request.priceInPanterCoins,
      createdAt: new Date(),
    });

    // Subcarpetas por usuario para el contenido tal cual se solicitó
    const presignedUploadUrl = await this.storageService.getPresignedUploadUrl(
      request.creatorId,
      contentId,
      'video/mp4',
    );

    return {
      contentId,
      status: 'AWAITING_MEDIA',
      message:
        'Los metadatos fueron creados. Proceda a subir el MP4 mediante la URL provista.',
      presignedUploadUrl,
    };
  }
}
