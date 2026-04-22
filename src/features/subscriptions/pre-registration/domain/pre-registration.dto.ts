import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, IsOptional, IsDateString, IsInt, Min, IsUUID } from 'class-validator';

export class PreRegistrationRequestDto {
  @ApiProperty({ example: 'juan.perez@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'juanperez' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: '1990-01-01' })
  @IsDateString()
  birthDate: string;

  @ApiProperty({ example: 'male' })
  @IsString()
  @IsNotEmpty()
  gender: string;

  @ApiProperty({ example: 25 })
  @IsInt()
  @Min(18)
  age: number;

  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', description: 'ID del plan de suscripción elegido' })
  @IsUUID()
  @IsNotEmpty()
  planId: string;
}

export class PreRegistrationResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  subscriptionId: string;

  @ApiProperty({ description: 'URL de redirección a la pasarela de pago' })
  checkoutUrl: string;

  @ApiProperty({ description: 'ID de la sesión de pago' })
  sessionId: string;
}
