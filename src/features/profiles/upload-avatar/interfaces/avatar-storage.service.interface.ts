export const AVATAR_STORAGE_SERVICE = Symbol('IAvatarStorageService');

export interface IAvatarStorageService {
  uploadAvatar(
    userId: string,
    originalName: string,
    mimeType: string,
    fileBuffer: Buffer,
  ): Promise<string>;
}
