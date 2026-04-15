import { IsBoolean } from 'class-validator';

export class UpdateUserStatusRequest {
  @IsBoolean()
  isActive!: boolean;
}

export class UpdateUserStatusResponse {
  success!: boolean;
  isActive!: boolean;
}
