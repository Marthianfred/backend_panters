import { Injectable, Inject } from '@nestjs/common';
import { CreatePayoutRequestCommand } from './create-payout-request.command';
import type { IPayoutsRepository } from '../../interfaces/payouts.repository.interface';
import { KinesisDataPublisherService } from '@/core/infrastructure/kinesis-data/kinesis-data-publisher.service';
import { PayoutStatus } from '../../enums/payout-status.enum';

@Injectable()
export class CreatePayoutRequestHandler {
  constructor(
    @Inject('IPayoutsRepository')
    private readonly repository: IPayoutsRepository,
    private readonly kinesisPublisher: KinesisDataPublisherService,
  ) {}

  async execute(command: CreatePayoutRequestCommand): Promise<{ id: string }> {
    const { dto } = command;

    await this.repository.reserveBalance(dto.creatorId, dto.amount);

    const payout = await this.repository.create({
      creatorId: dto.creatorId,
      amount: dto.amount,
      status: PayoutStatus.PENDING_APPROVAL,
    });

    await this.kinesisPublisher.publish(
      'payout.requested',
      {
        payoutId: payout.id,
        creatorId: payout.creatorId,
        amount: payout.amount,
        status: payout.status,
      },
      payout.creatorId,
    );

    return { id: payout.id };
  }
}
