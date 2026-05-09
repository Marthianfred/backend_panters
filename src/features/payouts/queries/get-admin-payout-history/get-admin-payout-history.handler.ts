import { Injectable, Inject } from '@nestjs/common';
import type { IPayoutsRepository } from '../../interfaces/payouts.repository.interface';
import { PayoutRequest } from '../../entities/payout-request.entity';

@Injectable()
export class GetAdminPayoutHistoryHandler {
  constructor(
    @Inject('IPayoutsRepository')
    private readonly repository: IPayoutsRepository,
  ) {}

  async execute(): Promise<PayoutRequest[]> {
    return this.repository.findAdminHistory();
  }
}
