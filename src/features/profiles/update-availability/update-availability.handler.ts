import { Injectable, Inject } from '@nestjs/common';
import type { IProfileAvailabilityRepository } from './interfaces/profile-availability.repository.interface';
import { PROFILE_AVAILABILITY_REPOSITORY } from './interfaces/profile-availability.repository.interface';

@Injectable()
export class UpdateAvailabilityHandler {
  constructor(
    @Inject(PROFILE_AVAILABILITY_REPOSITORY)
    private readonly repository: IProfileAvailabilityRepository,
  ) {}

  public async execute(userId: string, isOnline: boolean) {
    const result = await this.repository.updateAvailability(userId, isOnline);

    if (!result) {
      throw new Error(
        `Fallo al actualizar disponibilidad para el usuario ${userId}`,
      );
    }

    return result;
  }

  public async get(userId: string) {
    const result = await this.repository.getAvailability(userId);

    if (!result) {
      throw new Error(`Perfil no encontrado para el usuario ${userId}`);
    }

    return result;
  }
}
