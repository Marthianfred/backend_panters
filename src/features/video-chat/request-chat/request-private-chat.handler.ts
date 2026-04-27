import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import type { IVideoChatRepository } from '../interfaces/video-chat.repository.interface';
import { VIDEO_CHAT_REPOSITORY } from '../interfaces/video-chat.repository.interface';
import type { IKinesisVideoService } from '../../streaming/get-viewer-access/interfaces/kinesis.service.interface';
import { KINESIS_VIDEO_SERVICE } from '../../streaming/get-viewer-access/interfaces/kinesis.service.interface';
import type { IStreamRepository } from '../../streaming/get-viewer-access/interfaces/stream.repository.interface';
import { STREAM_REPOSITORY } from '../../streaming/get-viewer-access/interfaces/stream.repository.interface';
import { RequestPrivateChatDto, RequestPrivateChatResponse } from './request-private-chat.models';
import { LiveChatGateway } from '../../live-chat/infrastructure/live-chat.gateway';

@Injectable()
export class RequestPrivateChatHandler {
  private readonly PRICE_PER_MINUTE = 50;

  constructor(
    @Inject(VIDEO_CHAT_REPOSITORY)
    private readonly repository: IVideoChatRepository,
    @Inject(STREAM_REPOSITORY)
    private readonly streamRepository: IStreamRepository,
    @Inject(KINESIS_VIDEO_SERVICE)
    private readonly kinesisVideoService: IKinesisVideoService,
    private readonly configService: ConfigService,
    private readonly liveChatGateway: LiveChatGateway,
  ) {}

  async execute(userId: string, dto: RequestPrivateChatDto): Promise<RequestPrivateChatResponse> {
    const { creatorId, durationMinutes } = dto;

    if (durationMinutes <= 0) {
      throw new BadRequestException('La duración debe ser mayor a 0 minutos.');
    }

    const totalPrice = durationMinutes * this.PRICE_PER_MINUTE;

    const paymentResult = await this.repository.processPayment(
      userId,
      creatorId,
      totalPrice,
      `Chat privado de ${durationMinutes} minutos`
    );

    if (!paymentResult) {
      throw new BadRequestException('Saldo insuficiente para iniciar el chat privado.');
    }

    const streamId = randomUUID();
    const channelName = `Private-${creatorId}-${userId}-${Date.now()}`;
    const channelArn = await this.kinesisVideoService.createSignalingChannel(channelName);
    const region = this.configService.get<string>('KN_STREAMS_REGION', 'us-east-2');

    await this.streamRepository.createStream({
      id: streamId,
      creatorId: creatorId,
      channelArn: channelArn,
      region: region,
      s3ThumbnailBucket: this.configService.get<string>('AWS_BUCKET', 'panters'),
      s3ThumbnailKey: `thumbnails/private-streams/${streamId}.jpg`,
      isActive: false,
    });

    const session = await this.repository.createSession({
      creatorId,
      userId,
      durationMinutes,
      priceCoins: totalPrice,
      status: 'accepted',
      streamId,
    });

    const credentials = await this.kinesisVideoService.generateViewerCredentials(
      channelArn,
      userId
    );

    const signalingEndpoint = await this.kinesisVideoService.getSignalingEndpoint(
      channelArn,
      'VIEWER'
    );

    this.liveChatGateway.notifyPrivateChatRequest(creatorId, {
      sessionId: session.id,
      userId,
      durationMinutes,
      streamId,
      channelArn,
    });

    return {
      sessionId: session.id,
      streamId,
      channelArn,
      signalingEndpoint,
      credentials,
    };
  }
}
