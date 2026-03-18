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

  /**
   * Ejecuta el caso de uso: Registrar una reacción 'pantera' en un post del muro.
   * Este gesto incrementa la popularidad y contribuye al rating de la creadora.
   */
  async execute(userId: string, dto: ReactToPostDto): Promise<PostReactionResponse> {
    // 1. Validar existencia de la publicación (Wall Post)
    const exists = await this.repository.postExists(dto.postId);
    if (!exists) {
      throw new NotFoundException(`La publicación con ID ${dto.postId} no existe en el muro.`);
    }

    // 2. Identificar a la creadora para el evento de Rating
    const creatorId = await this.repository.getPostOwnerId(dto.postId);
    if (!creatorId) {
      throw new NotFoundException('No se pudo encontrar a la creadora de esta publicación.');
    }

    // 3. Persistir la reacción social en PostgreSQL
    const totalPanteras = await this.repository.upsertReaction(userId, dto.postId);

    // 4. Comunicar de forma asíncrona al flujo de Rating
    // La publicación de eventos NO bloquea la respuesta al front-end.
    this.eventPublisher.publish({
      userId,
      postId: dto.postId,
      creatorId,
      type: 'pantera',
      timestamp: new Date(),
    }).catch(err => {
      // Monitoreo preventivo del buffer de Kinesis
      console.error(`[PostReactions] Fallo el envío de evento: ${err.message}`);
    });

    return {
      success: true,
      totalPanteras: totalPanteras,
      message: 'Pantera acumulada. Esta reacción será procesada por nuestro sistema de rating.'
    };
  }
}
