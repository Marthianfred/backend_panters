import { IsString, IsNotEmpty, IsIn } from 'class-validator';


export class CreatePurchaseSessionDto {
  @IsString()
  @IsNotEmpty()
  priceId: string;
}
