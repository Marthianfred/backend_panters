import { IsNumber, IsPositive, IsString, IsNotEmpty } from 'class-validator';

export class CreatePayoutRequestDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsString()
  @IsNotEmpty()
  creatorId: string;
}
