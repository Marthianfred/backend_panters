export const CONTENT_STORAGE_SERVICE = Symbol('IContentStorageService');

export interface IContentStorageService {
  getPresignedUploadUrl(
    userId: string,
    contentId: string,
    mimeType?: string,
    folder?: string,
  ): Promise<string>;

  getPresignedDownloadUrl(userId: string, contentId: string, extension?: string, folder?: string): Promise<string>;
  deleteContent(userId: string, contentId: string, extension?: string, folder?: string): Promise<void>;
}
