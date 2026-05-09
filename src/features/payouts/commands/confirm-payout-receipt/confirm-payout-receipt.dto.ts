import { IsString, IsNotEmpty } from 'class-validator';

export class ConfirmPayoutReceiptDto {
  @IsString()
  @IsNotEmpty()
  payoutId: string;

  @IsString()
  @IsNotEmpty()
  creatorId: string;
}
