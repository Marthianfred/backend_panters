import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayoutsController } from './payouts.controller';
import { PayoutRequest } from './entities/payout-request.entity';
import { PostgresPayoutsRepository } from './infrastructure/postgres.payouts.repository';
import { CreatePayoutRequestHandler } from './commands/create-payout-request/create-payout-request.handler';
import { ApprovePayoutRequestHandler } from './commands/approve-payout-request/approve-payout-request.handler';
import { ConfirmPayoutReceiptHandler } from './commands/confirm-payout-receipt/confirm-payout-receipt.handler';
import { GetPendingPayoutsHandler } from './queries/get-pending-payouts/get-pending-payouts.handler';
import { GetCreatorPayoutHistoryHandler } from './queries/get-creator-payout-history/get-creator-payout-history.handler';
import { GetAdminPayoutHistoryHandler } from './queries/get-admin-payout-history/get-admin-payout-history.handler';
import { KinesisDataModule } from '@/core/infrastructure/kinesis-data/kinesis-data.module';

const CommandHandlers = [
  CreatePayoutRequestHandler,
  ApprovePayoutRequestHandler,
  ConfirmPayoutReceiptHandler,
];

const QueryHandlers = [
  GetPendingPayoutsHandler,
  GetCreatorPayoutHistoryHandler,
  GetAdminPayoutHistoryHandler,
];

@Module({
  imports: [TypeOrmModule.forFeature([PayoutRequest]), KinesisDataModule],
  controllers: [PayoutsController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: 'IPayoutsRepository',
      useClass: PostgresPayoutsRepository,
    },
  ],
})
export class PayoutsModule {}
