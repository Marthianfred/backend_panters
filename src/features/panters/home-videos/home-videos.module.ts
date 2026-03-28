import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@/core/database/database.module';

// Handlers
import { UploadHomeVideoHandler } from './upload-video/upload-video.handler';
import { GetHomeVideosHandler } from './list-videos/list-videos.handler';
import { DeleteHomeVideoHandler } from './delete-video/delete-video.handler';

// Controllers
import { UploadHomeVideoController } from './upload-video/upload-video.controller';
import { ListHomeVideosController } from './list-videos/list-videos.controller';
import { DeleteHomeVideoController } from './delete-video/delete-video.controller';

// Infrastructure
import { PostgresHomeVideoRepository } from './infrastructure/postgres.home-video.repository';
import { HOME_VIDEO_REPOSITORY } from './interfaces/home-video.repository.interface';
import { S3HomeVideoStorageService } from './infrastructure/s3.home-video-storage.service';
import { HOME_VIDEO_STORAGE_SERVICE } from './interfaces/home-video-storage.service.interface';

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [
    UploadHomeVideoController,
    ListHomeVideosController,
    DeleteHomeVideoController,
  ],
  providers: [
    UploadHomeVideoHandler,
    GetHomeVideosHandler,
    DeleteHomeVideoHandler,
    {
      provide: HOME_VIDEO_REPOSITORY,
      useClass: PostgresHomeVideoRepository,
    },
    {
      provide: HOME_VIDEO_STORAGE_SERVICE,
      useClass: S3HomeVideoStorageService,
    },
  ],
  exports: [HOME_VIDEO_REPOSITORY, HOME_VIDEO_STORAGE_SERVICE],
})
export class HomeVideosModule {}
