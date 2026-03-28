export const HOME_VIDEO_STORAGE_SERVICE = Symbol('HOME_VIDEO_STORAGE_SERVICE');

export interface IHomeVideoStorageService {
  uploadVideo(file: Express.Multer.File, key: string): Promise<string>;
  deleteVideo(key: string): Promise<void>;
  getPresignedUrl(key: string): Promise<string>;
}
