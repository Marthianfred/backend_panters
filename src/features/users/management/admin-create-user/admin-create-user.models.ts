import { IsEmail, IsString, IsUUID, MinLength } from 'class-validator';

export class AdminCreateUserRequest {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  name!: string;

  @IsUUID()
  roleId!: string;
}

export class AdminCreateUserResponse {
  userId!: string;
  email!: string;
  roleId!: string;
  mustChangePassword!: boolean;
}
