import { Injectable, Inject } from '@nestjs/common';
import * as crypto from 'crypto';
import { HOME_VIDEO_REPOSITORY } from '../interfaces/home-video.repository.interface';
import type { IHomeVideoRepository } from '../interfaces/home-video.repository.interface';
import { HOME_VIDEO_STORAGE_SERVICE } from '../interfaces/home-video-storage.service.interface';
import type { IHomeVideoStorageService } from '../interfaces/home-video-storage.service.interface';
import { UnsupportedMimeTypeError } from './upload-video.models';
import type { HomeVideoUploadResponse } from './upload-video.models';
import type { HomeVideo } from '../home-video.entity';

@Injectable()
export class UploadHomeVideoHandler {
  constructor(
    @Inject(HOME_VIDEO_REPOSITORY)
    private readonly repository: IHomeVideoRepository,
    @Inject(HOME_VIDEO_STORAGE_SERVICE)
    private readonly storageService: IHomeVideoStorageService,
  ) {}

  public async execute(file: Express.Multer.File): Promise<HomeVideoUploadResponse> {
    if (file.mimetype !== 'video/webm') {
      throw new UnsupportedMimeTypeError(file.mimetype);
    }

    const id = crypto.randomUUID();
    const extension = '.webm';
    const key = `VideosLoopHome/${id}${extension}`;

    const url = await this.storageService.uploadVideo(file, key);

    const video: HomeVideo = {
      id,
      key,
      url,
      originalName: file.originalname,
      mimeType: file.mimetype,
      createdAt: new Date(),
    };

    await this.repository.save(video);

    return {
      id,
      url,
      key,
    };
  }
}
