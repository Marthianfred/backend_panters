import { IsString, IsEnum } from 'class-validator';
import { UserRoleFlag } from '../admin-create-user/admin-create-user.models';

export class ChangeRoleRequest {
  @IsEnum(UserRoleFlag)
  role!: UserRoleFlag;
}
