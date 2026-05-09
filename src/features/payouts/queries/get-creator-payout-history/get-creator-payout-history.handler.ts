import { Injectable, Inject } from '@nestjs/common';
import { GetCreatorPayoutHistoryQuery } from './get-creator-payout-history.query';
import type { IPayoutsRepository } from '../../interfaces/payouts.repository.interface';
import { PayoutRequest } from '../../entities/payout-request.entity';

@Injectable()
export class GetCreatorPayoutHistoryHandler {
  constructor(
    @Inject('IPayoutsRepository')
    private readonly repository: IPayoutsRepository,
  ) {}

  async execute(query: GetCreatorPayoutHistoryQuery): Promise<PayoutRequest[]> {
    return this.repository.findByCreatorId(query.creatorId);
  }
}
