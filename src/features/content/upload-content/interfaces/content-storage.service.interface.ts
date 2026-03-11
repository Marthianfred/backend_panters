export const CONTENT_STORAGE_SERVICE = Symbol('IContentStorageService');

export interface IContentStorageService {
  getPresignedUploadUrl(
    userId: string,
    contentId: string,
    mimeType?: string,
  ): Promise<string>;

  getPresignedDownloadUrl(userId: string, contentId: string): Promise<string>;
  deleteContent(userId: string, contentId: string): Promise<void>;
}
