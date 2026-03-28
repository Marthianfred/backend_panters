import { Injectable, Inject } from '@nestjs/common';
import { HOME_VIDEO_REPOSITORY } from '../interfaces/home-video.repository.interface';
import type { IHomeVideoRepository } from '../interfaces/home-video.repository.interface';
import { HOME_VIDEO_STORAGE_SERVICE } from '../interfaces/home-video-storage.service.interface';
import type { IHomeVideoStorageService } from '../interfaces/home-video-storage.service.interface';
import { VideoNotFoundError } from './delete-video.models';
import type { HomeVideoDeleteResponse } from './delete-video.models';

@Injectable()
export class DeleteHomeVideoHandler {
  constructor(
    @Inject(HOME_VIDEO_REPOSITORY)
    private readonly repository: IHomeVideoRepository,
    @Inject(HOME_VIDEO_STORAGE_SERVICE)
    private readonly storageService: IHomeVideoStorageService,
  ) {}

  public async execute(id: string): Promise<HomeVideoDeleteResponse> {
    const video = await this.repository.getById(id);
    if (!video) {
      throw new VideoNotFoundError(id);
    }

    try {
      await this.storageService.deleteVideo(video.key);
    } catch (error) {
       console.error(`[DeleteHomeVideoHandler] Error deleting S3 object: ${video.key}`, error);
    }

    await this.repository.delete(id);

    return {
      success: true,
      message: 'Video eliminado correctamente del home.',
    };
  }
}
