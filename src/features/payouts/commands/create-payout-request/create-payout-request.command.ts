import { CreatePayoutRequestDto } from './create-payout-request.dto';

export class CreatePayoutRequestCommand {
  constructor(public readonly dto: CreatePayoutRequestDto) {}
}
