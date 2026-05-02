import { IsString, IsInt, IsBoolean, IsOptional, Min, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePtcPackageDto {
  @ApiProperty({ example: 'Small Pack' })
  @IsString()
  name: string;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  ptcAmount: number;

  @ApiProperty({ example: 9.99 })
  @IsNumber()
  @Min(0)
  priceUsd: number;

  @ApiProperty({ example: 'price_12345' })
  @IsString()
  stripePriceId: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
