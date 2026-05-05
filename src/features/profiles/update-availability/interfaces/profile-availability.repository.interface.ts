export const PROFILE_AVAILABILITY_REPOSITORY = Symbol(
  'IProfileAvailabilityRepository',
);

export interface ProfileAvailabilityData {
  userId: string;
  isOnline: boolean;
}

export interface IProfileAvailabilityRepository {
  updateAvailability(
    userId: string,
    isOnline: boolean,
  ): Promise<ProfileAvailabilityData | null>;
  getAvailability(userId: string): Promise<ProfileAvailabilityData | null>;
}
