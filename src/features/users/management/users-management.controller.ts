import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

import { AdminCreateUserHandler } from './admin-create-user/admin-create-user.handler';
import { AdminCreateUserRequest, AdminCreateUserResponse } from './admin-create-user/admin-create-user.models';
import { ListUsersHandler } from './list-users/list-users.handler';
import { ListUsersQuery, ListUsersResponse } from './list-users/list-users.models';
import { UpdateUserStatusHandler } from './update-user-status/update-user-status.handler';
import { UpdateUserStatusRequest } from './update-user-status/update-user-status.models';
import { ChangeRoleHandler } from './change-role/change-role.handler';
import { ChangeRoleRequest } from './change-role/change-role.models';
import { GetUserDetailsHandler } from './get-user-details/get-user-details.handler';
import { UserDetailsResponse } from './get-user-details/get-user-details.models';
import { ModerateContentHandler } from './moderate-content/moderate-content.handler';
import { ModerateContentRequest } from './moderate-content/moderate-content.models';
import { ListRolesHandler } from './list-roles/list-roles.handler';
import { ListRolesResponse } from './list-roles/list-roles.models';
import { Query } from '@nestjs/common';

@Controller('api/v1/management')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin', 'moderator')
export class UsersManagementController {
  constructor(
    private readonly createUserHandler: AdminCreateUserHandler,
    private readonly listUsersHandler: ListUsersHandler,
    private readonly updateUserStatusHandler: UpdateUserStatusHandler,
    private readonly changeRoleHandler: ChangeRoleHandler,
    private readonly getUserDetailsHandler: GetUserDetailsHandler,
    private readonly moderateContentHandler: ModerateContentHandler,
    private readonly listRolesHandler: ListRolesHandler,
  ) {}

  @Get('users')
  async listUsers(@Query() query: ListUsersQuery): Promise<ListUsersResponse> {
    return this.listUsersHandler.handle(query);
  }

  @Get('roles')
  async listRoles(): Promise<ListRolesResponse> {
    return this.listRolesHandler.handle();
  }

  @Post('users')
  async createUser(
    @Body() request: AdminCreateUserRequest,
  ): Promise<AdminCreateUserResponse> {
    return this.createUserHandler.handle(request);
  }

  @Patch('users/:id/status')
  async updateUserStatus(@Param('id') id: string, @Body() request: UpdateUserStatusRequest) {
    return this.updateUserStatusHandler.handle(id, request);
  }

  @Patch('users/:id/role')
  async changeRole(@Param('id') id: string, @Body() request: ChangeRoleRequest) {
    return this.changeRoleHandler.handle(id, request);
  }

  @Get('users/:id')
  async getUserDetails(@Param('id') id: string): Promise<UserDetailsResponse> {
    return this.getUserDetailsHandler.handle(id);
  }

  @Patch('content/:id/moderate')
  async moderateContent(
    @Param('id') id: string,
    @Body() request: ModerateContentRequest,
  ) {
    return this.moderateContentHandler.handle(id, request);
  }
}
