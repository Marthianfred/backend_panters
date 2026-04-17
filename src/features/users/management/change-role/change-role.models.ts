import { IsUUID } from 'class-validator';

export class ChangeRoleRequest {
  @IsUUID()
  roleId!: string;
}
