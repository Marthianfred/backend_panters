import { Injectable, Inject } from '@nestjs/common';
import type { IStreamRepository } from './interfaces/stream.repository.interface';
import { STREAM_REPOSITORY } from './interfaces/stream.repository.interface';
import type { IKinesisVideoService } from './interfaces/kinesis.service.interface';
import { KINESIS_VIDEO_SERVICE } from './interfaces/kinesis.service.interface';
import type { IS3Service } from './interfaces/s3.service.interface';
import { S3_SERVICE } from './interfaces/s3.service.interface';
import type {
  GetViewerAccessRequest,
  GetViewerAccessResponse,
} from './get-viewer-access.models';
import { StreamNotFoundError } from './get-viewer-access.models';

@Injectable()
export class GetViewerAccessHandler {
  constructor(
    @Inject(STREAM_REPOSITORY)
    private readonly streamRepository: IStreamRepository,
    @Inject(KINESIS_VIDEO_SERVICE)
    private readonly kinesisVideoService: IKinesisVideoService,
    @Inject(S3_SERVICE)
    private readonly s3Service: IS3Service,
  ) {}

  public async execute(
    request: GetViewerAccessRequest,
  ): Promise<GetViewerAccessResponse> {
    const streamMetadata = await this.streamRepository.getStreamMetadataById(
      request.streamId,
    );

    if (!streamMetadata) {
      throw new StreamNotFoundError(request.streamId);
    }

    const credentialsPromise =
      this.kinesisVideoService.generateViewerCredentials(
        streamMetadata.channelArn,
        request.userId,
      );

    const signalingEndpointPromise =
      this.kinesisVideoService.getSignalingEndpoint(
        streamMetadata.channelArn,
        'VIEWER',
      );

    const thumbnailUrlPromise = this.s3Service.getPresignedThumbnailUrl(
      streamMetadata.s3ThumbnailBucket,
      streamMetadata.s3ThumbnailKey,
    );

    const [credentials, thumbnailUrl, signalingEndpoint] = await Promise.all([
      credentialsPromise,
      thumbnailUrlPromise,
      signalingEndpointPromise,
    ]);

    const iceServers = await this.kinesisVideoService.getIceServers(
      streamMetadata.channelArn,
      credentials,
    );

    return {
      channelArn: streamMetadata.channelArn,
      region: streamMetadata.region,
      signalingEndpoint: signalingEndpoint,
      thumbnailUrl: thumbnailUrl,
      credentials: credentials,
      iceServers: iceServers,
    };

  }
}
