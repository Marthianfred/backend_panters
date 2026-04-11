import { Injectable, NotFoundException } from '@nestjs/common';
import { PostgresUsersManagementRepository } from '../infrastructure/postgres.users-management.repository';
import { UserDetailsResponse } from './get-user-details.models';

@Injectable()
export class GetUserDetailsHandler {
  constructor(private readonly repository: PostgresUsersManagementRepository) {}

  async handle(userId: string): Promise<UserDetailsResponse> {
    const details = await this.repository.getUserDetails(userId);
    
    if (!details) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado.`);
    }

    return details;
  }
}
