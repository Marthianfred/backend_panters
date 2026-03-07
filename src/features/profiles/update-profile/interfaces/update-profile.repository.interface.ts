export const UPDATE_PROFILE_REPOSITORY = Symbol('IUpdateProfileRepository');

export interface UpdatedProfileData {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
}

export interface IUpdateProfileRepository {
  updateProfileByUserId(
    userId: string,
    data: { fullName?: string; avatarUrl?: string; bio?: string },
  ): Promise<UpdatedProfileData | null>;
}
