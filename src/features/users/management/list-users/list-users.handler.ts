import { Injectable } from '@nestjs/common';
import { PostgresUsersManagementRepository } from '../infrastructure/postgres.users-management.repository';
import { ListUsersQuery, ListUsersResponse } from './list-users.models';

@Injectable()
export class ListUsersHandler {
  constructor(private readonly repository: PostgresUsersManagementRepository) {}

  async handle(query: ListUsersQuery): Promise<ListUsersResponse> {
    const { users, total } = await this.repository.listUsers(
      query.page,
      query.limit,
      query.search,
    );

    return {
      data: users,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }
}
