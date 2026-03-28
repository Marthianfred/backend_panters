import { Injectable, Inject } from '@nestjs/common';
import type { IStreamRepository } from '../get-viewer-access/interfaces/stream.repository.interface';
import { STREAM_REPOSITORY } from '../get-viewer-access/interfaces/stream.repository.interface';
import type { IS3Service } from '../get-viewer-access/interfaces/s3.service.interface';
import { S3_SERVICE } from '../get-viewer-access/interfaces/s3.service.interface';

export interface ActiveStream {
  id: string;
  creatorId: string;
  thumbnailUrl: string;
  region: string;
}

@Injectable()
export class GetActiveStreamsHandler {
  constructor(
    @Inject(STREAM_REPOSITORY)
    private readonly streamRepository: IStreamRepository,
    @Inject(S3_SERVICE)
    private readonly s3Service: IS3Service,
  ) {}

  public async execute(): Promise<ActiveStream[]> {
    const activeStreams = await this.streamRepository.getActiveStreams();

    return Promise.all(
      activeStreams.map(async (stream) => {
        const thumbnailUrl = await this.s3Service.getPresignedThumbnailUrl(
          stream.s3ThumbnailBucket,
          stream.s3ThumbnailKey,
        );

        return {
          id: stream.id,
          creatorId: stream.creatorId,
          thumbnailUrl,
          region: stream.region,
        };
      }),
    );
  }
}
