import { ApiProperty } from '@nestjs/swagger';

export class UserSubscriptionDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' })
  id: string;

  @ApiProperty({ example: 'user_123' })
  userId: string;

  @ApiProperty({ example: 'plan_uuid' })
  planId: string;

  @ApiProperty({
    example: 'pending',
    enum: ['pending', 'active', 'cancelled', 'expired'],
  })
  status: string;

  @ApiProperty({ example: 'stripe', required: false })
  paymentGateway?: string;

  @ApiProperty({ example: 'sub_12345', required: false })
  externalSubscriptionId?: string;

  @ApiProperty({ example: false })
  cancelAtPeriodEnd: boolean;

  @ApiProperty({ required: false })
  startsAt?: Date;

  @ApiProperty({ required: false })
  endsAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CreateUserSubscriptionDto {
  userId: string;
  planId: string;
  status?: string;
  paymentGateway?: string;
  externalSubscriptionId?: string;
  cancelAtPeriodEnd?: boolean;
  startsAt?: Date;
  endsAt?: Date;
}
export class UserSubscriptionWithPlanDto extends UserSubscriptionDto {
  planName: string;
  currentPeriodEnd?: Date;
}
