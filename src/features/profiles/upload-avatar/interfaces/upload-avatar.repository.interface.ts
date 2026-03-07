export const UPLOAD_AVATAR_REPOSITORY = Symbol('IUploadAvatarRepository');

export interface IUploadAvatarRepository {
  updateAvatarUrl(userId: string, avatarUrl: string): Promise<boolean>;
}
