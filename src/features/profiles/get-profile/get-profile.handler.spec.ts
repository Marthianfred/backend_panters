import { Test, TestingModule } from '@nestjs/testing';
import { GetProfileHandler } from './get-profile.handler';
import {
  IProfileRepository,
  PROFILE_REPOSITORY,
} from './interfaces/profile.repository.interface';
import { ProfileNotFoundError } from './get-profile.models';

describe('GetProfileHandler', () => {
  let handler: GetProfileHandler;
  let mockRepository: jest.Mocked<IProfileRepository>;

  beforeEach(async () => {
    mockRepository = {
      getProfileByUserId: jest.fn(),
    } as unknown as jest.Mocked<IProfileRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProfileHandler,
        { provide: PROFILE_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    handler = module.get<GetProfileHandler>(GetProfileHandler);
  });

  it('debe retornar el perfil correctamente con id_user', async () => {
    const userId = 'user-123';
    const mockProfileData = {
      id: 'profile-uuid',
      userId: 'user-123',
      fullName: 'Panter User',
      avatarUrl: 'https://avatar.com/123',
      bio: 'Bio text',
      username: 'panteruser',
    };

    (mockRepository.getProfileByUserId as jest.Mock).mockResolvedValue(
      mockProfileData,
    );

    const result = await handler.execute({ userId });

    expect(mockRepository.getProfileByUserId).toHaveBeenCalledWith(userId);
    expect(result).toEqual({
      id: 'profile-uuid',
      id_user: 'user-123',
      fullName: 'Panter User',
      avatarUrl: 'https://avatar.com/123',
      bio: 'Bio text',
    });
  });

  it('debe lanzar ProfileNotFoundError si el perfil no existe', async () => {
    const userId = 'user-456';
    (mockRepository.getProfileByUserId as jest.Mock).mockResolvedValue(null);

    await expect(handler.execute({ userId })).rejects.toThrow(
      ProfileNotFoundError,
    );
  });
});
