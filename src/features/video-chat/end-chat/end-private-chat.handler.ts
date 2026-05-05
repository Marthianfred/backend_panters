import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import type { IVideoChatRepository } from '../interfaces/video-chat.repository.interface';
import { VIDEO_CHAT_REPOSITORY } from '../interfaces/video-chat.repository.interface';
import {
  EndPrivateChatDto,
  EndPrivateChatResponse,
} from './end-private-chat.models';
import { LiveChatGateway } from '../../live-chat/infrastructure/live-chat.gateway';

@Injectable()
export class EndPrivateChatHandler {
  constructor(
    @Inject(VIDEO_CHAT_REPOSITORY)
    private readonly repository: IVideoChatRepository,
    private readonly liveChatGateway: LiveChatGateway,
  ) {}

  async execute(
    userId: string,
    sessionId: string,
    dto: EndPrivateChatDto,
  ): Promise<EndPrivateChatResponse> {
    const session = await this.repository.getSessionById(sessionId);

    if (!session) {
      throw new NotFoundException('Sesión de chat privado no encontrada.');
    }

    const isCreator = session.creatorId === userId;
    const isClient = session.userId === userId;

    if (!isCreator && !isClient) {
      throw new ForbiddenException(
        'No tienes permiso para finalizar este chat privado.',
      );
    }

    if (session.status === 'completed' || session.status === 'canceled') {
      return {
        sessionId: session.id,
        status: session.status,
        endedAt: new Date(),
      };
    }

    await this.repository.updateSessionStatus(sessionId, 'completed');

    // Notificar a ambas partes vía WebSocket que la llamada ha finalizado
    this.liveChatGateway.server
      .to(`live_${session.creatorId}`)
      .emit('privateChatEnded', {
        sessionId: session.id,
        reason: dto.reason || 'Terminada por el usuario',
      });

    return {
      sessionId: session.id,
      status: 'completed',
      endedAt: new Date(),
    };
  }
}
