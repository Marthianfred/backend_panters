import { Injectable, Inject } from '@nestjs/common';
import type { IUploadAvatarRepository } from './interfaces/upload-avatar.repository.interface';
import { UPLOAD_AVATAR_REPOSITORY } from './interfaces/upload-avatar.repository.interface';
import type { IAvatarStorageService } from './interfaces/avatar-storage.service.interface';
import { AVATAR_STORAGE_SERVICE } from './interfaces/avatar-storage.service.interface';
import type {
  UploadAvatarRequest,
  UploadAvatarResponse,
} from './upload-avatar.models';
import { AvatarUploadFailedError } from './upload-avatar.models';
import sharp from 'sharp';

@Injectable()
export class UploadAvatarHandler {
  constructor(
    @Inject(UPLOAD_AVATAR_REPOSITORY)
    private readonly repository: IUploadAvatarRepository,
    @Inject(AVATAR_STORAGE_SERVICE)
    private readonly storageService: IAvatarStorageService,
  ) {}

  public async execute(
    request: UploadAvatarRequest,
  ): Promise<UploadAvatarResponse> {
    try {
      // Forzar conversión de cualquier imagen entrante al formato WebP optimizado
      const webpBuffer = await sharp(request.fileBuffer)
        .webp({ quality: 80 })
        .toBuffer();

      const webpName = `${request.originalName.split('.')[0]}.webp`;

      const s3Url = await this.storageService.uploadAvatar(
        request.userId,
        webpName,
        'image/webp',
        webpBuffer,
      );

      const success = await this.repository.updateAvatarUrl(
        request.userId,
        s3Url,
      );

      if (!success) {
        throw new AvatarUploadFailedError(request.userId);
      }

      return { avatarUrl: s3Url };
    } catch (error) {
      if (error instanceof AvatarUploadFailedError) {
        throw error;
      }
      throw new AvatarUploadFailedError(request.userId);
    }
  }
}
