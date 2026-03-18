import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class RatePanterRequest {
  @IsUUID()
  @IsNotEmpty()
  creatorId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  rating: number;

  @IsString()
  @IsOptional()
  comment?: string;
}

export class RatePanterResponse {
  id: string;
  creatorId: string;
  subscriberId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export class GetPanterRatingSummaryResponse {
  creatorId: string;
  averageRating: number;
  totalVotes: number;
}
