import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ApprovePayoutRequestCommand } from './approve-payout-request.command';
import type { IPayoutsRepository } from '../../interfaces/payouts.repository.interface';
import { KinesisDataPublisherService } from '@/core/infrastructure/kinesis-data/kinesis-data-publisher.service';
import { PayoutStatus } from '../../enums/payout-status.enum';

@Injectable()
export class ApprovePayoutRequestHandler {
  constructor(
    @Inject('IPayoutsRepository')
    private readonly repository: IPayoutsRepository,
    private readonly kinesisPublisher: KinesisDataPublisherService,
  ) {}

  async execute(
    command: ApprovePayoutRequestCommand,
  ): Promise<{ success: boolean }> {
    const { dto } = command;

    const payout = await this.repository.findById(dto.payoutId);
    if (!payout) {
      throw new NotFoundException('Solicitud de cobro no encontrada.');
    }

    await this.repository.updateStatus(
      dto.payoutId,
      PayoutStatus.PENDING_RECEIPT_CONFIRMATION,
      {
        adminId: dto.adminId,
        approvedAt: new Date(),
      },
    );

    await this.kinesisPublisher.publish(
      'payout.approved',
      {
        payoutId: payout.id,
        creatorId: payout.creatorId,
        amount: payout.amount,
        status: PayoutStatus.PENDING_RECEIPT_CONFIRMATION,
      },
      payout.creatorId,
    );

    return { success: true };
  }
}
