import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class UpgradeSubscriptionDto {
  @ApiProperty({ example: '44a6cc06-05d5-4c90-a75c-a8f386535325', description: 'ID del nuevo plan al que se desea subir' })
  @IsNotEmpty()
  @IsUUID()
  targetPlanId: string;
}

export class UpgradeSessionResponse {
  @ApiProperty()
  url: string;

  @ApiProperty()
  sessionId: string;
}
