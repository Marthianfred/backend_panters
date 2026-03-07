import { UpdateProfileHandler } from '../update-profile.handler';
import { IUpdateProfileRepository } from '../interfaces/update-profile.repository.interface';
import { ProfileUpdateFailedError } from '../update-profile.models';

describe('UpdateProfileHandler', () => {
  let handler: UpdateProfileHandler;
  let repositorySpy: jest.Mocked<IUpdateProfileRepository>;

  beforeEach(() => {
    repositorySpy = {
      updateProfileByUserId: jest.fn(),
    } as unknown as jest.Mocked<IUpdateProfileRepository>;
    handler = new UpdateProfileHandler(repositorySpy);
  });

  describe('execute', () => {
    it('should successfully update the profile', async () => {
      const mockRequest = {
        userId: 'user123',
        fullName: 'New Name',
        bio: 'New bio',
        avatarUrl: 'http://pic.jpg',
      };

      const mockUpdatedData = {
        id: 'prof123',
        userId: 'user123',
        fullName: 'New Name',
        bio: 'New bio',
        avatarUrl: 'http://pic.jpg',
      };

      repositorySpy.updateProfileByUserId.mockResolvedValue(mockUpdatedData);

      const response = await handler.execute(mockRequest);

      expect(repositorySpy.updateProfileByUserId).toHaveBeenCalledWith(
        'user123',
        {
          fullName: 'New Name',
          bio: 'New bio',
          avatarUrl: 'http://pic.jpg',
        },
      );
      expect(response).toEqual({
        id: 'prof123',
        fullName: 'New Name',
        avatarUrl: 'http://pic.jpg',
        bio: 'New bio',
      });
    });

    it('should throw ProfileUpdateFailedError when repository returns null', async () => {
      const mockRequest = {
        userId: 'user123',
        fullName: 'New Name',
      };

      repositorySpy.updateProfileByUserId.mockResolvedValue(null);

      await expect(handler.execute(mockRequest)).rejects.toThrow(
        ProfileUpdateFailedError,
      );

      expect(repositorySpy.updateProfileByUserId).toHaveBeenCalledWith(
        'user123',
        {
          fullName: 'New Name',
          avatarUrl: undefined,
          bio: undefined,
        },
      );
    });
  });
});
