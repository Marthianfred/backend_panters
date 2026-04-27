import { Injectable, Inject, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IVideoChatRepository } from '../interfaces/video-chat.repository.interface';
import { VIDEO_CHAT_REPOSITORY } from '../interfaces/video-chat.repository.interface';
import type { IKinesisVideoService } from '../../streaming/get-viewer-access/interfaces/kinesis.service.interface';
import { KINESIS_VIDEO_SERVICE } from '../../streaming/get-viewer-access/interfaces/kinesis.service.interface';

@Injectable()
export class JoinPrivateChatHandler {
  constructor(
    @Inject(VIDEO_CHAT_REPOSITORY)
    private readonly repository: IVideoChatRepository,
    @Inject(KINESIS_VIDEO_SERVICE)
    private readonly kinesisVideoService: IKinesisVideoService,
  ) {}

  async execute(userId: string, sessionId: string) {
    const session = await this.repository.getSessionById(sessionId);

    if (!session) {
      throw new NotFoundException('Sesión de chat privado no encontrada.');
    }

    const isCreator = session.creatorId === userId;
    const isClient = session.userId === userId;

    if (!isCreator && !isClient) {
      throw new ForbiddenException('No tienes permiso para unirte a este chat privado.');
    }

    if (!session.channelArn) {
      throw new BadRequestException('El canal de señalización no está configurado para esta sesión.');
    }

    const role = isCreator ? 'MASTER' : 'VIEWER';

    const credentials = role === 'MASTER' 
      ? await this.kinesisVideoService.generateProducerCredentials(session.channelArn, userId)
      : await this.kinesisVideoService.generateViewerCredentials(session.channelArn, userId);

    const signalingEndpoint = await this.kinesisVideoService.getSignalingEndpoint(
      session.channelArn,
      role
    );

    return {
      sessionId: session.id,
      role,
      signalingEndpoint,
      credentials,
    };
  }
}
