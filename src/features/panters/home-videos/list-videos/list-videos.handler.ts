import { Injectable, Inject } from '@nestjs/common';
import { HOME_VIDEO_REPOSITORY } from '../interfaces/home-video.repository.interface';
import type { IHomeVideoRepository } from '../interfaces/home-video.repository.interface';
import type { HomeVideo } from '../home-video.entity';

@Injectable()
export class GetHomeVideosHandler {
  constructor(
    @Inject(HOME_VIDEO_REPOSITORY)
    private readonly repository: IHomeVideoRepository,
  ) {}

  public async execute(): Promise<HomeVideo[]> {
    return await this.repository.getAll();
  }
}
