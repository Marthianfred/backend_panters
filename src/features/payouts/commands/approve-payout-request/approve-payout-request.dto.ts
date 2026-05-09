import { IsString, IsNotEmpty } from 'class-validator';

export class ApprovePayoutRequestDto {
  @IsString()
  @IsNotEmpty()
  payoutId: string;

  @IsString()
  @IsNotEmpty()
  adminId: string;
}
