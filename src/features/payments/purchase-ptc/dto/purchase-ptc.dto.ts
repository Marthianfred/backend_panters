import { IsString, IsNotEmpty, IsIn } from 'class-validator';

/**
 * DTO para solicitar la creación de una sesión de compra de PTC.
 * Los priceIds deben corresponder a los configurados en Stripe para 100, 500 y 1000 PTC.
 */
export class CreatePurchaseSessionDto {
  @IsString()
  @IsNotEmpty()
  priceId: string;
}
