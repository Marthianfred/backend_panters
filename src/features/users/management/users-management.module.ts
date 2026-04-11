import { Module } from '@nestjs/common';
import { UsersManagementController } from './users-management.controller';
import { AdminCreateUserHandler } from './admin-create-user/admin-create-user.handler';
import { ListUsersHandler } from './list-users/list-users.handler';
import { DeactivateUserHandler } from './deactivate-user/deactivate-user.handler';
import { ChangeRoleHandler } from './change-role/change-role.handler';
import { GetUserDetailsHandler } from './get-user-details/get-user-details.handler';
import { ModerateContentHandler } from './moderate-content/moderate-content.handler';
import { PostgresUsersManagementRepository } from './infrastructure/postgres.users-management.repository';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [UsersManagementController],
  providers: [
    PostgresUsersManagementRepository,
    AdminCreateUserHandler,
    ListUsersHandler,
    DeactivateUserHandler,
    ChangeRoleHandler,
    GetUserDetailsHandler,
    ModerateContentHandler,
  ],
  exports: [PostgresUsersManagementRepository],
})
export class UsersManagementModule {}
