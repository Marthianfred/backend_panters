export const S3_SERVICE = Symbol('IS3Service');

export interface IS3Service {
  getPresignedThumbnailUrl(bucket: string, key: string): Promise<string>;
}
