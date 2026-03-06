export const PROFILE_REPOSITORY = Symbol('IProfileRepository');

export interface ProfileData {
  id: string;
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
}

export interface IProfileRepository {
  getProfileByUserId(userId: string): Promise<ProfileData | null>;
}
