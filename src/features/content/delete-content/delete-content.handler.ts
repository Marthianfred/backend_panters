import { Injectable, Inject } from '@nestjs/common';
import type { IContentRepository } from '../interfaces/content.repository.interface';
import { CONTENT_REPOSITORY_TOKEN } from '../interfaces/content.repository.interface';
import type { IContentStorageService } from '../upload-content/interfaces/content-storage.service.interface';
import { CONTENT_STORAGE_SERVICE } from '../upload-content/interfaces/content-storage.service.interface';
import {
  DeleteContentRequest,
  DeleteContentResponse,
  ContentNotFoundError,
  UnauthorizedDeleteError,
} from './delete-content.models';

@Injectable()
export class DeleteContentHandler {
  constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly contentRepository: IContentRepository,
    @Inject(CONTENT_STORAGE_SERVICE)
    private readonly storageService: IContentStorageService,
  ) {}

  public async execute(
    request: DeleteContentRequest,
  ): Promise<DeleteContentResponse> {
    
    const content = await this.contentRepository.getContentById(
      request.contentId,
    );

    if (!content) {
      throw new ContentNotFoundError();
    }

    
    if (content.creatorId !== request.creatorId) {
      throw new UnauthorizedDeleteError();
    }

    
    
    if (content.url) {
      const extension = content.url.substring(content.url.lastIndexOf('.'));
      await this.storageService.deleteContent(
        request.creatorId,
        request.contentId,
        extension,
        'content',
      );
    }

    
    if (content.thumbnailUrl) {
      const thumbExt = content.thumbnailUrl.substring(content.thumbnailUrl.lastIndexOf('.'));
      await this.storageService.deleteContent(
        request.creatorId,
        request.contentId,
        thumbExt,
        'thumbnails',
      );
    }

    
    await this.contentRepository.deleteContent(request.contentId);

    
    

    return new DeleteContentResponse(
      true,
      'Contenido eliminado correctamente de la base de datos y almacenamiento.',
    );
  }
}
