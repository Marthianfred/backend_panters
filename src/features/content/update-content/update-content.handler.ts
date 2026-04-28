import { Injectable, Inject } from '@nestjs/common';
import type { IContentRepository } from '../interfaces/content.repository.interface';
import { CONTENT_REPOSITORY_TOKEN } from '../interfaces/content.repository.interface';
import {
  UpdateContentRequest,
  UpdateContentResponse,
  ContentNotFoundError,
  UnauthorizedUpdateError,
} from './update-content.models';

@Injectable()
export class UpdateContentHandler {
  constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly contentRepository: IContentRepository,
  ) {}

  public async execute(
    request: UpdateContentRequest,
  ): Promise<UpdateContentResponse> {
    
    const content = await this.contentRepository.getContentById(
      request.contentId,
    );

    if (!content) {
      throw new ContentNotFoundError();
    }

    
    if (content.creatorId !== request.creatorId) {
      throw new UnauthorizedUpdateError();
    }

    
    const { updates } = request;
    await this.contentRepository.updateContent(request.contentId, updates);

    
    

    return new UpdateContentResponse(
      true,
      'Contenido actualizado exitosamente.',
    );
  }
}
