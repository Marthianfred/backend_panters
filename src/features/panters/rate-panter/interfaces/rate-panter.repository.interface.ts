import { RatePanterRequest, RatePanterResponse, GetPanterRatingSummaryResponse } from '../rate-panter.models';

export const PANTER_RATING_REPOSITORY = 'PANTER_RATING_REPOSITORY';

export interface IPanterRatingRepository {
  
  upsertRating(subscriberId: string, data: RatePanterRequest): Promise<RatePanterResponse>;

  
  getRatingSummary(creatorId: string): Promise<GetPanterRatingSummaryResponse>;

  
  panterExists(creatorId: string): Promise<boolean>;
}
