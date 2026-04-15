import { Injectable, NotFoundException } from '@nestjs/common';
import { PostgresUsersManagementRepository } from '../infrastructure/postgres.users-management.repository';
import { UpdateUserStatusRequest, UpdateUserStatusResponse } from './update-user-status.models';

@Injectable()
export class UpdateUserStatusHandler {
  constructor(private readonly repository: PostgresUsersManagementRepository) {}

  async handle(
    userId: string,
    request: UpdateUserStatusRequest,
  ): Promise<UpdateUserStatusResponse> {
    const exists = await this.repository.exists(userId);
    if (!exists) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado.`);
    }

    await this.repository.updateUserStatus(userId, request.isActive);

    return {
      success: true,
      isActive: request.isActive,
    };
  }
}
