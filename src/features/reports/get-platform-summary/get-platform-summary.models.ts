import { ApiProperty } from '@nestjs/swagger';

export class GetPlatformSummaryQueryDto {
  @ApiProperty({ required: false })
  startDate?: string;

  @ApiProperty({ required: false })
  endDate?: string;
}

export class ModelFinancialStatsDto {
  @ApiProperty()
  creatorId: string;

  @ApiProperty()
  creatorName: string;

  @ApiProperty()
  totalEarnedPtc: number;

  @ApiProperty()
  totalEarnedUsd: number;
}

export class PlatformSummaryResponseDto {
  @ApiProperty()
  totalSubscribers: number;

  @ApiProperty()
  newUsersCount: number;

  @ApiProperty({ type: [ModelFinancialStatsDto] })
  topModelsByRevenue: ModelFinancialStatsDto[];

  @ApiProperty()
  generatedAt: string;
}
