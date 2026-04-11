import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { UserManagementDetails } from '../infrastructure/postgres.users-management.repository';

export class ListUsersQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @IsOptional()
  @IsString()
  search?: string;
}

export class ListUsersResponse {
  data!: UserManagementDetails[];
  meta!: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
