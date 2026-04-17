import { Injectable } from '@nestjs/common';
import { PostgresUsersManagementRepository } from '../infrastructure/postgres.users-management.repository';
import { ListRolesResponse } from './list-roles.models';

@Injectable()
export class ListRolesHandler {
  constructor(private readonly repository: PostgresUsersManagementRepository) {}

  async handle(): Promise<ListRolesResponse> {
    const roles = await this.repository.listRoles();
    return {
      roles: roles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description ?? undefined,
      })),
    };
  }
}
