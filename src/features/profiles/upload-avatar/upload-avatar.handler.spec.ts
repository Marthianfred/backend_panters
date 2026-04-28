import { Test, TestingModule } from '@nestjs/testing';
import { UploadAvatarHandler } from './upload-avatar.handler';
import { UPLOAD_AVATAR_REPOSITORY } from './interfaces/upload-avatar.repository.interface';
import { AVATAR_STORAGE_SERVICE } from './interfaces/avatar-storage.service.interface';
import { AvatarUploadFailedError } from './upload-avatar.models';

const mockWebpBuffer = Buffer.from('mocked-webp-buffer');

jest.mock('sharp', () => {
  return jest.fn().mockImplementation(() => ({
    webp: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(mockWebpBuffer),
  }));
});

describe('UploadAvatarHandler', () => {
  let handler: UploadAvatarHandler;
  let mockRepository: { updateAvatarUrl: jest.Mock };
  let mockStorageService: { uploadAvatar: jest.Mock };

  beforeEach(async () => {
    mockRepository = { updateAvatarUrl: jest.fn() };
    mockStorageService = { uploadAvatar: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadAvatarHandler,
        {
          provide: UPLOAD_AVATAR_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: AVATAR_STORAGE_SERVICE,
          useValue: mockStorageService,
        },
      ],
    }).compile();

    handler = module.get<UploadAvatarHandler>(UploadAvatarHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockRequest = {
      userId: 'user-123',
      fileBuffer: Buffer.from('test-data'),
      originalName: 'image.png',
      mimeType: 'image/png',
    };

    it('should successfully upload avatar and update repository url', async () => {
      const mockS3Url = 'https://fake-s3-url.com/avatar.webp';
      mockStorageService.uploadAvatar.mockResolvedValue(mockS3Url);
      mockRepository.updateAvatarUrl.mockResolvedValue(true);

      const result = await handler.execute(mockRequest);

      expect(mockStorageService.uploadAvatar).toHaveBeenCalledWith(
        mockRequest.userId,
        
        'image.webp', 
        'image/webp',
        mockWebpBuffer,
      );
      expect(mockRepository.updateAvatarUrl).toHaveBeenCalledWith(
        mockRequest.userId,
        mockS3Url,
      );
      expect(result).toEqual({ avatarUrl: mockS3Url });
    });

    it('should throw AvatarUploadFailedError if database update fails', async () => {
      const mockS3Url = 'https://fake-s3-url.com/avatar.png';
      mockStorageService.uploadAvatar.mockResolvedValue(mockS3Url);
      mockRepository.updateAvatarUrl.mockResolvedValue(false);

      await expect(handler.execute(mockRequest)).rejects.toThrow(
        AvatarUploadFailedError,
      );
    });

    it('should pass through AvatarUploadFailedError if storage service throws it', async () => {
      const dbError = new AvatarUploadFailedError(mockRequest.userId);
      mockStorageService.uploadAvatar.mockRejectedValue(dbError);

      await expect(handler.execute(mockRequest)).rejects.toThrow(
        AvatarUploadFailedError,
      );
    });

    it('should wrap unknown errors in AvatarUploadFailedError', async () => {
      mockStorageService.uploadAvatar.mockRejectedValue(
        new Error('S3 offline'),
      );

      await expect(handler.execute(mockRequest)).rejects.toThrow(
        AvatarUploadFailedError,
      );
    });
  });
});
