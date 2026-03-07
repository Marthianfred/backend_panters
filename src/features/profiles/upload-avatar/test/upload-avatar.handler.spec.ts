import { UploadAvatarHandler } from '../upload-avatar.handler';
import { IUploadAvatarRepository } from '../interfaces/upload-avatar.repository.interface';
import { IAvatarStorageService } from '../interfaces/avatar-storage.service.interface';
import { AvatarUploadFailedError } from '../upload-avatar.models';

describe('UploadAvatarHandler', () => {
  let handler: UploadAvatarHandler;
  let repositorySpy: jest.Mocked<IUploadAvatarRepository>;
  let storageSpy: jest.Mocked<IAvatarStorageService>;

  beforeEach(() => {
    repositorySpy = {
      updateAvatarUrl: jest.fn(),
    };
    storageSpy = {
      uploadAvatar: jest.fn(),
    };
    handler = new UploadAvatarHandler(repositorySpy, storageSpy);
  });

  describe('execute', () => {
    it('should successfully upload avatar and update profile', async () => {
      const mockRequest = {
        userId: 'user123',
        originalName: 'photo.jpg',
        mimeType: 'image/jpeg',
        fileBuffer: Buffer.from('test'),
      };

      const mockS3Url = 'https://s3.url/avatar.jpg';

      storageSpy.uploadAvatar.mockResolvedValue(mockS3Url);
      repositorySpy.updateAvatarUrl.mockResolvedValue(true);

      const response = await handler.execute(mockRequest);

      expect(storageSpy.uploadAvatar).toHaveBeenCalledWith(
        'user123',
        'photo.jpg',
        'image/jpeg',
        mockRequest.fileBuffer,
      );
      expect(repositorySpy.updateAvatarUrl).toHaveBeenCalledWith(
        'user123',
        mockS3Url,
      );
      expect(response).toEqual({
        avatarUrl: mockS3Url,
      });
    });

    it('should throw AvatarUploadFailedError if database update fails', async () => {
      const mockRequest = {
        userId: 'user123',
        originalName: 'photo.jpg',
        mimeType: 'image/jpeg',
        fileBuffer: Buffer.from('test'),
      };

      const mockS3Url = 'https://s3.url/avatar.jpg';

      storageSpy.uploadAvatar.mockResolvedValue(mockS3Url);
      repositorySpy.updateAvatarUrl.mockResolvedValue(false);

      await expect(handler.execute(mockRequest)).rejects.toThrow(
        AvatarUploadFailedError,
      );

      expect(storageSpy.uploadAvatar).toHaveBeenCalled();
      expect(repositorySpy.updateAvatarUrl).toHaveBeenCalled();
    });

    it('should throw AvatarUploadFailedError if storage upload fails', async () => {
      const mockRequest = {
        userId: 'user123',
        originalName: 'photo.jpg',
        mimeType: 'image/jpeg',
        fileBuffer: Buffer.from('test'),
      };

      storageSpy.uploadAvatar.mockRejectedValue(new Error('S3 error'));

      await expect(handler.execute(mockRequest)).rejects.toThrow(
        AvatarUploadFailedError,
      );

      expect(storageSpy.uploadAvatar).toHaveBeenCalled();
      expect(repositorySpy.updateAvatarUrl).not.toHaveBeenCalled();
    });
  });
});
