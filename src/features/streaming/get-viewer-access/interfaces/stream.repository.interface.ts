export const STREAM_REPOSITORY = Symbol('IStreamRepository');

export interface StreamMetadata {
  channelArn: string;
  region: string;
  s3ThumbnailBucket: string;
  s3ThumbnailKey: string;
}

export interface IStreamRepository {
  getStreamMetadataById(streamId: string): Promise<StreamMetadata | null>;
}
