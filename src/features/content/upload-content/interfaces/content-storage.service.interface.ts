export const CONTENT_STORAGE_SERVICE = Symbol('IContentStorageService');

export interface IContentStorageService {
  getPresignedUploadUrl(
    userId: string,
    contentId: string,
    mimeType?: string,
  ): Promise<string>;
}
