import { Test, TestingModule } from '@nestjs/testing';
import { UploadHomeVideoHandler } from '../upload-video/upload-video.handler';
import { GetHomeVideosHandler } from '../list-videos/list-videos.handler';
import { DeleteHomeVideoHandler } from '../delete-video/delete-video.handler';
import { HOME_VIDEO_REPOSITORY } from '../interfaces/home-video.repository.interface';
import { HOME_VIDEO_STORAGE_SERVICE } from '../interfaces/home-video-storage.service.interface';
import { UnsupportedMimeTypeError } from '../upload-video/upload-video.models';
import { VideoNotFoundError } from '../delete-video/delete-video.models';

describe('HomeVideos Handlers', () => {
  let uploadHandler: UploadHomeVideoHandler;
  let getHandler: GetHomeVideosHandler;
  let deleteHandler: DeleteHomeVideoHandler;

  const mockRepository = {
    getAll: jest.fn(),
    getById: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockStorageService = {
    uploadVideo: jest.fn(),
    deleteVideo: jest.fn(),
    getPresignedUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadHomeVideoHandler,
        GetHomeVideosHandler,
        DeleteHomeVideoHandler,
        {
          provide: HOME_VIDEO_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: HOME_VIDEO_STORAGE_SERVICE,
          useValue: mockStorageService,
        },
      ],
    }).compile();

    uploadHandler = module.get<UploadHomeVideoHandler>(UploadHomeVideoHandler);
    getHandler = module.get<GetHomeVideosHandler>(GetHomeVideosHandler);
    deleteHandler = module.get<DeleteHomeVideoHandler>(DeleteHomeVideoHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('UploadHomeVideoHandler', () => {
    it('should throw UnsupportedMimeTypeError if file is not webm', async () => {
      const mockFile = { mimetype: 'video/mp4' } as Express.Multer.File;
      await expect(uploadHandler.execute(mockFile)).rejects.toThrow(UnsupportedMimeTypeError);
    });

    it('should upload video and save to repository if file is webm', async () => {
      const mockFile = { 
        mimetype: 'video/webm', 
        originalname: 'test.webm',
        buffer: Buffer.from('test')
      } as Express.Multer.File;
      
      mockStorageService.uploadVideo.mockResolvedValue('http://s3/test.webm');
      mockRepository.save.mockResolvedValue(undefined);

      const result = await uploadHandler.execute(mockFile);

      expect(result).toHaveProperty('id');
      expect(result.url).toBe('http://s3/test.webm');
      expect(mockStorageService.uploadVideo).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('GetHomeVideosHandler', () => {
    it('should return all videos from repository', async () => {
      const mockVideos = [{ id: '1', url: 'url1' }];
      mockRepository.getAll.mockResolvedValue(mockVideos);

      const result = await getHandler.execute();

      expect(result).toBe(mockVideos);
      expect(mockRepository.getAll).toHaveBeenCalled();
    });
  });

  describe('DeleteHomeVideoHandler', () => {
    it('should throw VideoNotFoundError if video does not exist', async () => {
      mockRepository.getById.mockResolvedValue(null);
      await expect(deleteHandler.execute('uuid')).rejects.toThrow(VideoNotFoundError);
    });

    it('should delete from storage and repository if video exists', async () => {
      const mockVideo = { id: 'uuid', key: 'key1' };
      mockRepository.getById.mockResolvedValue(mockVideo);
      mockStorageService.deleteVideo.mockResolvedValue(undefined);
      mockRepository.delete.mockResolvedValue(undefined);

      const result = await deleteHandler.execute('uuid');

      expect(result.success).toBe(true);
      expect(mockStorageService.deleteVideo).toHaveBeenCalledWith('key1');
      expect(mockRepository.delete).toHaveBeenCalledWith('uuid');
    });
  });
});
