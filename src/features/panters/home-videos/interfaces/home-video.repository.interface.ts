import { HomeVideo } from '../home-video.entity';

export const HOME_VIDEO_REPOSITORY = Symbol('HOME_VIDEO_REPOSITORY');

export interface IHomeVideoRepository {
  getAll(): Promise<HomeVideo[]>;
  getById(id: string): Promise<HomeVideo | null>;
  save(video: HomeVideo): Promise<void>;
  delete(id: string): Promise<void>;
}
