import { ConfirmPayoutReceiptDto } from './confirm-payout-receipt.dto';

export class ConfirmPayoutReceiptCommand {
  constructor(public readonly dto: ConfirmPayoutReceiptDto) {}
}
