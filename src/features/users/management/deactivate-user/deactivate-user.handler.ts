import { Injectable, NotFoundException } from '@nestjs/common';
import { PostgresUsersManagementRepository } from '../infrastructure/postgres.users-management.repository';

@Injectable()
export class DeactivateUserHandler {
  constructor(private readonly repository: PostgresUsersManagementRepository) {}

  async handle(userId: string): Promise<{ success: boolean }> {
    const exists = await this.repository.exists(userId);
    if (!exists) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado.`);
    }

    await this.repository.deactivateUser(userId);
    return { success: true };
  }
}
