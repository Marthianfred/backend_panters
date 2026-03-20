import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsString, IsNumber, Min, IsArray, IsOptional, IsBoolean } from 'class-validator';

export class SubscriptionPlanDto {
  @ApiProperty({ description: 'ID del plan', example: '123e4567-er89...' })
  id: string;

  @ApiProperty({ description: 'Nombre del plan', example: 'PLAN MISIONERO' })
  name: string;

  @ApiProperty({ description: 'Descripción opcional', example: 'Beneficios VIP' })
  description?: string;

  @ApiProperty({ description: 'Precio en USD', example: 25.00 })
  priceUsd: number;

  @ApiProperty({ description: 'Duración en días', example: 30 })
  durationDays: number;

  @ApiProperty({ description: 'Lista de beneficios', example: ['Chat ilimitado'] })
  benefits: string[];

  @ApiProperty({ description: 'ID del precio en Stripe', example: 'price_1...' })
  stripePriceId?: string;

  @ApiProperty({ description: 'Si el plan está activo', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: Date;
}

export class CreatePlanDto {
  @ApiProperty({ example: 'VIP MENSUAL' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 25.00 })
  @IsNumber()
  @Min(0)
  priceUsd: number;

  @ApiProperty({ example: 30 })
  @IsNumber()
  @Min(1)
  durationDays: number;

  @ApiProperty({ example: ['Chat', 'Contenido'] })
  @IsArray()
  @IsOptional()
  benefits?: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  stripePriceId?: string;
}

export class UpdatePlanDto {
  @ApiProperty()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @IsOptional()
  priceUsd?: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  @IsOptional()
  durationDays?: number;

  @ApiProperty()
  @IsArray()
  @IsOptional()
  benefits?: string[];

  @ApiProperty()
  @IsString()
  @IsOptional()
  stripePriceId?: string;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
