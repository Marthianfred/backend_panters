import { Injectable, Inject } from '@nestjs/common';
import type { IUpdateProfileRepository } from './interfaces/update-profile.repository.interface';
import { UPDATE_PROFILE_REPOSITORY } from './interfaces/update-profile.repository.interface';
import type {
  UpdateProfileRequest,
  UpdateProfileResponse,
} from './update-profile.models';
import { ProfileUpdateFailedError } from './update-profile.models';

@Injectable()
export class UpdateProfileHandler {
  constructor(
    @Inject(UPDATE_PROFILE_REPOSITORY)
    private readonly profileRepository: IUpdateProfileRepository,
  ) {}

  public async execute(
    request: UpdateProfileRequest,
  ): Promise<UpdateProfileResponse> {
    const updatedProfile = await this.profileRepository.updateProfileByUserId(
      request.userId,
      {
        fullName: request.fullName,
        avatarUrl: request.avatarUrl,
        bio: request.bio,
      },
    );

    if (!updatedProfile) {
      throw new ProfileUpdateFailedError(request.userId);
    }

    return {
      id: updatedProfile.id,
      fullName: updatedProfile.fullName,
      avatarUrl: updatedProfile.avatarUrl,
      bio: updatedProfile.bio,
    };
  }
}
