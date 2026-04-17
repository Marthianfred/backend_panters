import { Injectable, NotFoundException } from '@nestjs/common';
import { PostgresUsersManagementRepository } from '../infrastructure/postgres.users-management.repository';
import { ChangeRoleRequest } from './change-role.models';

@Injectable()
export class ChangeRoleHandler {
  constructor(private readonly repository: PostgresUsersManagementRepository) {}

  async handle(userId: string, request: ChangeRoleRequest): Promise<{ success: boolean; roleId: string }> {
    const userExists = await this.repository.exists(userId);
    if (!userExists) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado.`);
    }

    const roleExists = await this.repository.existsRole(request.roleId);
    if (!roleExists) {
      throw new NotFoundException(`El rol con ID ${request.roleId} no existe en el sistema.`);
    }

    await this.repository.updateUserRole(userId, request.roleId);
    return { success: true, roleId: request.roleId };
  }
}
