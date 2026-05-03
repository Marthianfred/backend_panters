import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class GetPlatformRevenueQueryDto {
  @ApiProperty({ required: false, description: 'Fecha de inicio para el reporte (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, description: 'Fecha de fin para el reporte (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class RevenueMetrics {
  @ApiProperty({ description: 'Monto total en Panter Coins' })
  ptc: number;

  @ApiProperty({ description: 'Monto total equivalente en USD' })
  usd: number;
}

export class PlatformRevenueResponseDto {
  @ApiProperty({ description: 'Ingresos brutos totales' })
  grossRevenue: RevenueMetrics;

  @ApiProperty({ description: 'Comisiones de la plataforma (30%)' })
  platformCommission: RevenueMetrics;

  @ApiProperty({ description: 'Ingresos netos de creadoras (70%)' })
  creatorEarnings: RevenueMetrics;

  @ApiProperty({ description: 'Ingresos por suscripciones (100% plataforma)' })
  subscriptionRevenue: RevenueMetrics;

  @ApiProperty({ description: 'Fecha del reporte' })
  generatedAt: string;
}
