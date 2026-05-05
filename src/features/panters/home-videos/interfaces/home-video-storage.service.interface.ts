export const HOME_VIDEO_STORAGE_SERVICE = Symbol('HOME_VIDEO_STORAGE_SERVICE');

export interface IHomeVideoStorageService {
  uploadVideo(
    file: Express.Multer.File,
    key: string,
    onProgress?: (bytesSent: number, totalBytes: number) => void,
  ): Promise<string>;
  deleteVideo(key: string): Promise<void>;
  getPresignedUrl(key: string): Promise<string>;
  getUploadPresignedUrl(key: string, contentType: string): Promise<string>;
}
