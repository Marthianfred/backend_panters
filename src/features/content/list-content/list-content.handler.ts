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

    const purchasedIds = request.subscriberId
      ? await this.contentRepository.getPurchasedContentIds(
          request.subscriberId,
        )
      : [];

    const contentsDTO: ContentItemDTO[] = rawContents.map((content) => ({
      id: content.id,
      title: content.title,
      description: content.description,
      type: content.type,
      price: content.price,
      creatorId: content.creatorId,
      createdAt: content.createdAt,
      thumbnailUrl: content.thumbnailUrl || '',
      isBought: purchasedIds.includes(content.id),
    }));

    // Extraemos la info del creador desde el primer resultado (si existe) para la cabecera del muro
    let creatorInfo: { fullName: string; avatarUrl: string; isOnline: boolean } | undefined = undefined;
    if (rawContents.length > 0 && rawContents[0].creatorDetails) {
      creatorInfo = {
        fullName: rawContents[0].creatorDetails.fullName,
        avatarUrl: rawContents[0].creatorDetails.avatarUrl,
        isOnline: rawContents[0].creatorDetails.isOnline,
      };
    }

    return {
      creator: creatorInfo,
      contents: contentsDTO,
    };
  }
}
