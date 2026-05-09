import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfirmPayoutReceiptCommand } from './confirm-payout-receipt.command';
import type { IPayoutsRepository } from '../../interfaces/payouts.repository.interface';
import { PayoutStatus } from '../../enums/payout-status.enum';

@Injectable()
export class ConfirmPayoutReceiptHandler {
  constructor(
    @Inject('IPayoutsRepository')
    private readonly repository: IPayoutsRepository,
  ) {}

  async execute(
    command: ConfirmPayoutReceiptCommand,
  ): Promise<{ success: boolean }> {
    const { dto } = command;

    const payout = await this.repository.findById(dto.payoutId);
    if (!payout) {
      throw new NotFoundException('Solicitud de cobro no encontrada.');
    }

    if (payout.creatorId !== dto.creatorId) {
      throw new ForbiddenException(
        'No tienes permiso para confirmar esta solicitud.',
      );
    }

    if (payout.status !== PayoutStatus.PENDING_RECEIPT_CONFIRMATION) {
      throw new BadRequestException(
        'La solicitud debe estar aprobada para confirmar la recepción.',
      );
    }

    await this.repository.updateStatus(dto.payoutId, PayoutStatus.COMPLETED, {
      confirmedAt: new Date(),
    });

    return { success: true };
  }
}
