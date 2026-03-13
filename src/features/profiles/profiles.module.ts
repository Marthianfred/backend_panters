import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GetProfileController } from './get-profile/get-profile.controller';
import { GetProfileHandler } from './get-profile/get-profile.handler';
import { PostgresProfileRepository } from './get-profile/infrastructure/postgres.profile.repository';
import { PROFILE_REPOSITORY } from './get-profile/interfaces/profile.repository.interface';

// Update Profile Feature
import { UpdateProfileController } from './update-profile/update-profile.controller';
import { UpdateProfileHandler } from './update-profile/update-profile.handler';
import { PostgresUpdateProfileRepository } from './update-profile/infrastructure/postgres.update-profile.repository';
import { UPDATE_PROFILE_REPOSITORY } from './update-profile/interfaces/update-profile.repository.interface';

// Upload Avatar Feature
import { UploadAvatarController } from './upload-avatar/upload-avatar.controller';
import { UploadAvatarHandler } from './upload-avatar/upload-avatar.handler';
import { PostgresUploadAvatarRepository } from './upload-avatar/infrastructure/postgres.upload-avatar.repository';
import { UPLOAD_AVATAR_REPOSITORY } from './upload-avatar/interfaces/upload-avatar.repository.interface';
import { AVATAR_STORAGE_SERVICE } from './upload-avatar/interfaces/avatar-storage.service.interface';
import { MinioAvatarStorageService } from './upload-avatar/infrastructure/minio.avatar-storage.service';

@Module({
  imports: [AuthModule],
  controllers: [
    GetProfileController,
    UpdateProfileController,
    UploadAvatarController,
  ],
  providers: [
    GetProfileHandler,
    {
      provide: PROFILE_REPOSITORY,
      useClass: PostgresProfileRepository,
    },
    UpdateProfileHandler,
    {
      provide: UPDATE_PROFILE_REPOSITORY,
      useClass: PostgresUpdateProfileRepository,
    },
    UploadAvatarHandler,
    {
      provide: UPLOAD_AVATAR_REPOSITORY,
      useClass: PostgresUploadAvatarRepository,
    },
    {
      provide: AVATAR_STORAGE_SERVICE,
      useClass: MinioAvatarStorageService,
    },
  ],
  exports: [PROFILE_REPOSITORY],
})
export class ProfilesModule {}
