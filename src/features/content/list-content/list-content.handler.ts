import { Injectable, Inject } from '@nestjs/common';
import type { IContentRepository } from '../interfaces/content.repository.interface';
import { CONTENT_REPOSITORY_TOKEN } from '../interfaces/content.repository.interface';
import { CONTENT_STORAGE_SERVICE } from '../upload-content/interfaces/content-storage.service.interface';
import type { IContentStorageService } from '../upload-content/interfaces/content-storage.service.interface';
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
    @Inject(CONTENT_STORAGE_SERVICE)
    private readonly storageService: IContentStorageService,
  ) {}

  public async execute(
    request: ListContentRequest,
  ): Promise<ListContentResponse> {
    const page = request.page || 1;
    const limit = Math.min(request.limit || 20, 20); 

    const rawContents = await this.contentRepository.listContents({
      creatorId: request.creatorId,
      subscriberId: request.subscriberId,
      published: true,
      type: request.type,
      page,
      limit,
    });

    const totalItems = await this.contentRepository.countContents({
      creatorId: request.creatorId,
      published: true,
      type: request.type,
    });

    const purchasedIds = request.subscriberId
      ? await this.contentRepository.getPurchasedContentIds(
          request.subscriberId,
        )
      : [];

    const contentsDTO: ContentItemDTO[] = await Promise.all(
      rawContents.map(async (content) => {
        const isBought = purchasedIds.includes(content.id);
        const isCreator = request.subscriberId === content.creatorId;

        let thumbnailUrl: string = '';

        
        
        if (content.thumbnailUrl) {
          const thumbExt = content.thumbnailUrl.substring(content.thumbnailUrl.lastIndexOf('.'));
          thumbnailUrl = await this.storageService.getPresignedDownloadUrl(
            content.creatorId,
            content.id,
            thumbExt,
            'thumbnails',
          );
        } else if (content.type === 'photo' && content.url) {
          
          const imgExt = content.url.substring(content.url.lastIndexOf('.'));
          thumbnailUrl = await this.storageService.getPresignedDownloadUrl(
            content.creatorId,
            content.id,
            imgExt,
            'content',
          );
        }

        return {
          id: content.id,
          title: content.title,
          description: content.description,
          type: content.type,
          price: content.price,
          accessType: content.accessType,
          creatorId: content.creatorId,
          createdAt: content.createdAt,
          thumbnailUrl: thumbnailUrl,
          isBought,
          panterasCount: content.panterasCount || 0,
          hasReacted: rowHasReacted(content),
        };
      }),
    );

    
    let creatorInfo: { fullName: string; avatarUrl: string; isOnline: boolean } | undefined = undefined;
    if (request.creatorId && rawContents.length > 0 && rawContents[0].creatorDetails) {
      const details = rawContents[0].creatorDetails;
      creatorInfo = {
        fullName: details.fullName,
        avatarUrl: details.avatarUrl,
        isOnline: details.isOnline,
      };
    }

    return {
      creator: creatorInfo,
      contents: contentsDTO,
      pagination: {
        page,
        limit,
        total: totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }
}


function rowHasReacted(content: any): boolean {
    return content.hasReacted === true;
}
