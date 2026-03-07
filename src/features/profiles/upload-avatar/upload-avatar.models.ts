export class AvatarUploadFailedError extends Error {
  constructor(public readonly userId: string) {
    super(`Fallo al subir el avatar para el usuario: ${userId}`);
    this.name = 'AvatarUploadFailedError';
  }
}

export interface UploadAvatarRequest {
  userId: string;
  fileBuffer: Buffer;
  mimeType: string;
  originalName: string;
}

export interface UploadAvatarResponse {
  avatarUrl: string;
}
