import { Controller, Get } from '@nestjs/common';
import { GetHomeVideosHandler } from './list-videos.handler';
import { ListLoopVideosResponse, ListManagerVideosResponse } from './list-videos.models';

@Controller('api/v1/panters/home-videos')
export class ListHomeVideosController {
  constructor(private readonly handler: GetHomeVideosHandler) {}

  @Get('loop')
  public async getLoop(): Promise<ListLoopVideosResponse> {
    const videos = await this.handler.execute();
    return videos.map(video => video.url);
  }

  @Get('manager')
  public async getManager(): Promise<ListManagerVideosResponse> {
    return await this.handler.execute();
  }
}
