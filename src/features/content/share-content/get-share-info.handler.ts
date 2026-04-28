import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IContentRepository } from '../interfaces/content.repository.interface';
import { CONTENT_REPOSITORY_TOKEN } from '../interfaces/content.repository.interface';
import { ShareInfoResponse } from './share-content.models';

@Injectable()
export class GetShareInfoHandler {
  constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly contentRepository: IContentRepository,
  ) {}

  async execute(contentId: string, loggedUserId?: string): Promise<ShareInfoResponse> {
    const post = await this.contentRepository.getContentById(contentId);
    if (!post) throw new NotFoundException('Publicación no encontrada.');

    
    let isPurchased = false;
    if (loggedUserId) {
        const boughtIds = await this.contentRepository.getPurchasedContentIds(loggedUserId);
        isPurchased = boughtIds.includes(contentId);
    }

    
    
    
    const isFree = post.accessType === 'free' || post.price === 0;
    const canView = isFree || isPurchased;

    
    let action: 'NONE' | 'LOGIN' | 'SUBSCRIBE' | 'BUY_COINS' | 'BUY_CONTENT' = 'NONE';
    if (!loggedUserId) action = 'LOGIN';
    else if (!isPurchased && !isFree) {
        
        action = post.price > 0 ? 'BUY_CONTENT' : 'SUBSCRIBE';
    }

    return {
      content: {
        id: post.id,
        title: post.title,
        description: post.description,
        thumbnailUrl: post.thumbnailUrl || '', 
        type: post.type,
        price: post.price,
        accessType: post.accessType,
      },
      creator: {
        id: post.creatorId,
        fullName: post.creatorDetails?.fullName || 'Panter Creator',
        avatarUrl: post.creatorDetails?.avatarUrl || '',
        isOnline: post.creatorDetails?.isOnline || false,
      },
      accessStatus: {
        isLoggedIn: !!loggedUserId,
        isSubscribed: !!loggedUserId, 
        isPurchased,
        canView,
        requiredAction: action,
      }
    };
  }
}
