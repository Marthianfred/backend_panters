import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, IsBoolean, Min } from 'class-validator';

export class CreateSubscriptionPlanDto {
  @ApiProperty({ description: 'Nombre del plan', example: 'Plan Premium' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Descripción detallada del plan', example: 'Acceso total a la plataforma', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Precio en USD', example: 29.99 })
  @IsNumber()
  @Min(0)
  priceUsd: number;

  @ApiProperty({ description: 'Duración del plan en días', example: 30 })
  @IsNumber()
  @Min(1)
  durationDays: number;

  @ApiProperty({ description: 'Lista de beneficios del plan', example: ['Chat ilimitado', 'Soporte 24/7'], type: [String], required: false })
  @IsArray()
  @IsOptional()
  benefits?: string[];

  @ApiProperty({ description: 'ID de precio de Stripe', example: 'price_12345', required: false })
  @IsString()
  @IsOptional()
  stripePriceId?: string;

  @ApiProperty({ description: 'Estado inicial del plan', example: true, default: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
