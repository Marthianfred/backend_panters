export interface GetProfileRequest {
  userId: string;
}

export interface GetProfileResponse {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
}

export class ProfileNotFoundError extends Error {
  constructor(userId: string) {
    super(`No se encontró un perfil para el usuario ${userId}`);
    this.name = 'ProfileNotFoundError';
  }
}
