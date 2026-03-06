import { Injectable, Inject } from '@nestjs/common';
import type { IContentRepository } from '../interfaces/content.repository.interface';
import { CONTENT_REPOSITORY_TOKEN } from '../interfaces/content.repository.interface';
import type {
  ListContentRequest,
  ListContentResponse,
  ContentItemDTO,
} from './list-content.models';

@Injectable()
export class ListContentHandler {
  constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly contentRepository: IContentRepository,
  ) {}

  public async execute(
    request: ListContentRequest,
  ): Promise<ListContentResponse> {
    const rawContents = await this.contentRepository.listContents({
      creatorId: request.creatorId,
    });

    // Filtros visuales: No mandamos las URLs de video en la lista pública por piratería
    const contentsDTO: ContentItemDTO[] = rawContents.map((content) => ({
      id: content.id,
      title: content.title,
      description: content.description,
      price: content.price,
      creatorId: content.creatorId,
      createdAt: content.createdAt,
    }));

    return { contents: contentsDTO };
  }
}
