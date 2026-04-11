import { Injectable, NotFoundException } from '@nestjs/common';
import { PostgresUsersManagementRepository } from '../infrastructure/postgres.users-management.repository';
import { ChangeRoleRequest } from './change-role.models';

@Injectable()
export class ChangeRoleHandler {
  constructor(private readonly repository: PostgresUsersManagementRepository) {}

  async handle(userId: string, request: ChangeRoleRequest): Promise<{ success: boolean; newRole: string }> {
    const exists = await this.repository.exists(userId);
    if (!exists) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado.`);
    }

    await this.repository.updateUserRole(userId, request.role);
    return { success: true, newRole: request.role };
  }
}
