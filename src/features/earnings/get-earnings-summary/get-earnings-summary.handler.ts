import { Injectable, Inject } from '@nestjs/common';
import { EARNINGS_REPOSITORY_TOKEN } from '../interfaces/earnings.repository.interface';
import type { IEarningsRepository } from '../interfaces/earnings.repository.interface';
import type { EarningsSummaryResponse } from './get-earnings-summary.models';

@Injectable()
export class GetEarningsSummaryHandler {
  constructor(
    @Inject(EARNINGS_REPOSITORY_TOKEN)
    private readonly earningsRepository: IEarningsRepository,
  ) {}

  public async execute(creatorId: string): Promise<EarningsSummaryResponse> {
    return await this.earningsRepository.getCreatorEarningsSummary(creatorId);
  }
}
