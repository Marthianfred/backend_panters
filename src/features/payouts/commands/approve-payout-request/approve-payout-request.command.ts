import { ApprovePayoutRequestDto } from './approve-payout-request.dto';

export class ApprovePayoutRequestCommand {
  constructor(public readonly dto: ApprovePayoutRequestDto) {}
}
