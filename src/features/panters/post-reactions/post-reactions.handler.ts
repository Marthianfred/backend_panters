import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IPostReactionRepository } from './interfaces/post-reactions.repository.interface';
import { POST_REACTION_REPOSITORY_TOKEN } from './interfaces/post-reactions.repository.interface';
import type { IPostReactionEventPublisher } from './interfaces/post-reactions-event-publisher.interface';
import { POST_REACTION_EVENT_PUBLISHER_TOKEN } from './interfaces/post-reactions-event-publisher.interface';
import { ReactToPostDto, PostReactionResponse } from './post-reactions.models';

@Injectable()
export class ReactToPostHandler {
  constructor(
    @Inject(POST_REACTION_REPOSITORY_TOKEN)
    private readonly repository: IPostReactionRepository,

    @Inject(POST_REACTION_EVENT_PUBLISHER_TOKEN)
    private readonly eventPublisher: IPostReactionEventPublisher,
  ) {}

  
  async execute(userId: string, dto: ReactToPostDto): Promise<PostReactionResponse> {
    
    const exists = await this.repository.postExists(dto.postId);
    if (!exists) {
      throw new NotFoundException(`La publicación con ID ${dto.postId} no existe en el muro.`);
    }

    
    const creatorId = await this.repository.getPostOwnerId(dto.postId);
    if (!creatorId) {
      throw new NotFoundException('No se pudo encontrar a la creadora de esta publicación.');
    }

    
    const totalPanteras = await this.repository.upsertReaction(userId, dto.postId);

    
    
    this.eventPublisher.publish({
      userId,
      postId: dto.postId,
      creatorId,
      type: 'pantera',
      timestamp: new Date(),
    }).catch(err => {
      
      console.error(`[PostReactions] Fallo el envío de evento: ${err.message}`);
    });

    return {
      success: true,
      totalPanteras: totalPanteras,
      message: 'Pantera acumulada. Esta reacción será procesada por nuestro sistema de rating.'
    };
  }
}
