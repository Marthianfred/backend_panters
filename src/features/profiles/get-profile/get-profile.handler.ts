import { Injectable, Inject } from '@nestjs/common';
import type { IProfileRepository } from './interfaces/profile.repository.interface';
import { PROFILE_REPOSITORY } from './interfaces/profile.repository.interface';
import type {
  GetProfileRequest,
  GetProfileResponse,
} from './get-profile.models';
import { ProfileNotFoundError } from './get-profile.models';

@Injectable()
export class GetProfileHandler {
  constructor(
    @Inject(PROFILE_REPOSITORY)
    private readonly profileRepository: IProfileRepository,
  ) {}

  public async execute(
    request: GetProfileRequest,
  ): Promise<GetProfileResponse> {
    const profileData = await this.profileRepository.getProfileByUserId(
      request.userId,
    );

    if (!profileData) {
      throw new ProfileNotFoundError(request.userId);
    }

    return {
      id: profileData.id,
      fullName: profileData.fullName,
      avatarUrl: profileData.avatarUrl,
      bio: profileData.bio,
    };
  }
}
