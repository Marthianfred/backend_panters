import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionStatusQueryDto {
  @ApiProperty({
    description: 'ID de la suscripción interna',
    example: 'efff0bd2-0227-48d1-8e17-a0d546a11182',
  })
  subscriptionId: string;
}

export class SubscriptionStatusResponseDto {
  @ApiProperty({ example: 'efff0bd2-0227-48d1-8e17-a0d546a11182' })
  id: string;

  @ApiProperty({ example: 'active', enum: ['pending', 'active', 'canceled', 'expired'] })
  status: string;

  @ApiProperty({ example: 'stripe' })
  paymentGateway: string;

  @ApiProperty({ example: 'sub_123456789', nullable: true })
  externalSubscriptionId: string | null;

  @ApiProperty({ example: '2026-04-25T20:20:10.000Z' })
  updatedAt: Date;
}
