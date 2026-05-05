import { IsEmail, IsString, IsEnum, MinLength } from 'class-validator';

export enum UserRoleFlag {
  ADMIN = 'admin',
  MODEL = 'model',
  SUBSCRIBER = 'subscriber',
}

export class AdminCreateUserRequest {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  name!: string;

  @IsEnum(UserRoleFlag)
  role!: UserRoleFlag;
}

export class AdminCreateUserResponse {
  userId!: string;
  email!: string;
  role!: string;
  mustChangePassword!: boolean;
}
