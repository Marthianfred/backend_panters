export class ProfileUpdateFailedError extends Error {
  constructor(public readonly userId: string) {
    super(`Fallo al actualizar el perfil para el usuario con ID ${userId}`);
    this.name = 'ProfileUpdateFailedError';
  }
}

export interface UpdateProfileRequest {
  userId: string;
  fullName?: string;
  avatarUrl?: string;
  bio?: string;
}

export interface UpdateProfileResponse {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
}
