import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import type { IStreamRepository } from '../get-viewer-access/interfaces/stream.repository.interface';
import { STREAM_REPOSITORY } from '../get-viewer-access/interfaces/stream.repository.interface';
import type { IKinesisVideoService } from '../get-viewer-access/interfaces/kinesis.service.interface';
import { KINESIS_VIDEO_SERVICE } from '../get-viewer-access/interfaces/kinesis.service.interface';
import { CreateStreamRequest, CreateStreamResponse } from './create-stream.models';

@Injectable()
export class CreateStreamHandler {
  constructor(
    @Inject(STREAM_REPOSITORY)
    private readonly streamRepository: IStreamRepository,
    @Inject(KINESIS_VIDEO_SERVICE)
    private readonly kinesisVideoService: IKinesisVideoService,
    private readonly configService: ConfigService,
  ) {}

  public async execute(request: CreateStreamRequest): Promise<CreateStreamResponse> {
    if (!request.title || request.title.trim().length === 0) {
      throw new Error('El título de la transmisión es obligatorio.');
    }

    const streamId = randomUUID();

    const region = this.configService.get<string>('KN_STREAMS_REGION', 'us-east-2');
    const channelName = `Stream-${request.creatorId}-${Date.now()}`;

    
    await this.streamRepository.deactivateAllStreamsByCreator(request.creatorId);

    
    const channelArn = await this.kinesisVideoService.createSignalingChannel(channelName);

    
    const credentials = await this.kinesisVideoService.generateProducerCredentials(
      channelArn,
      request.creatorId,
    );

    
    const signalingEndpoint = await this.kinesisVideoService.getSignalingEndpoint(
      channelArn,
      'MASTER',
    );

    
    await this.streamRepository.createStream({
      id: streamId,
      creatorId: request.creatorId,
      channelArn: channelArn,
      region: region,
      s3ThumbnailBucket: this.configService.get<string>('AWS_BUCKET', 'panters'),
      s3ThumbnailKey: `thumbnails/streams/${streamId}.jpg`,
      isActive: true,
    });

    return {
      streamId,
      channelArn,
      region,
      signalingEndpoint,
      credentials,
    };
  }
}
