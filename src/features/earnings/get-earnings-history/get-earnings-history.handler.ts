import { Injectable, Inject } from '@nestjs/common';
import { EARNINGS_REPOSITORY_TOKEN } from '../interfaces/earnings.repository.interface';
import type { IEarningsRepository } from '../interfaces/earnings.repository.interface';
import { EarningsHistoryRequest, EarningsHistoryResponse } from './get-earnings-history.models';

@Injectable()
export class GetEarningsHistoryHandler {
  constructor(
    @Inject(EARNINGS_REPOSITORY_TOKEN)
    private readonly earningsRepository: IEarningsRepository,
  ) {}

  public async execute(request: EarningsHistoryRequest): Promise<EarningsHistoryResponse> {
    return await this.earningsRepository.getCreatorEarningsHistory(request);
  }
}
