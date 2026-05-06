import { ApiProperty } from '@nestjs/swagger';

export class MySubscriptionResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: 'VIP MENSUAL' })
  planName: string;

  @ApiProperty({ example: '2026-05-28T23:59:59Z', nullable: true })
  currentPeriodEnd: string | null;

  @ApiProperty({ example: false })
  cancelAtPeriodEnd: boolean;
}
