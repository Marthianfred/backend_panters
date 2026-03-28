export const STREAM_REPOSITORY = Symbol('IStreamRepository');

export interface StreamMetadata {
  id: string;
  creatorId: string;
  channelArn: string;
  region: string;
  s3ThumbnailBucket: string;
  s3ThumbnailKey: string;
  isActive: boolean;
}

export interface IStreamRepository {
  getStreamMetadataById(streamId: string): Promise<StreamMetadata | null>;
  createStream(stream: StreamMetadata): Promise<void>;
  getActiveStreams(): Promise<StreamMetadata[]>;
}
