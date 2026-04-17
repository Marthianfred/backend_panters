import { IsString, IsUUID } from 'class-validator';

export class RoleResponse {
  @IsUUID()
  id!: string;

  @IsString()
  name!: string;

  @IsString()
  description?: string;
}

export class ListRolesResponse {
  roles!: RoleResponse[];
}
