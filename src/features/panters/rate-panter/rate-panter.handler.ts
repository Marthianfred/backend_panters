import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IPanterRatingRepository } from './interfaces/rate-panter.repository.interface';
import { PANTER_RATING_REPOSITORY } from './interfaces/rate-panter.repository.interface';
import { RatePanterRequest, RatePanterResponse, GetPanterRatingSummaryResponse } from './rate-panter.models';

@Injectable()
export class RatePanterHandler {
  constructor(
    @Inject(PANTER_RATING_REPOSITORY)
    private readonly repository: IPanterRatingRepository,
  ) {}

  async execute(subscriberId: string, request: RatePanterRequest): Promise<RatePanterResponse> {
    const exists = await this.repository.panterExists(request.creatorId);
    if (!exists) {
      throw new NotFoundException(`La Panter con ID ${request.creatorId} no existe.`);
    }

    return await this.repository.upsertRating(subscriberId, request);
  }

  async getSummary(creatorId: string): Promise<GetPanterRatingSummaryResponse> {
    const exists = await this.repository.panterExists(creatorId);
    if (!exists) {
      throw new NotFoundException(`La Panter con ID ${creatorId} no existe.`);
    }

    return await this.repository.getRatingSummary(creatorId);
  }
}
