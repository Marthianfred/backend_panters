import { IsString, IsNotEmpty } from 'class-validator';

export class CreatePurchaseSessionDto {
  @IsString()
  @IsNotEmpty()
  priceId: string;
}
