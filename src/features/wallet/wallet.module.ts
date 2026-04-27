import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GetBalanceController } from './get-balance/get-balance.controller';
import { GetBalanceHandler } from './get-balance/get-balance.handler';
import { PostgresWalletRepository } from './get-balance/infrastructure/postgres.wallet.repository';
import { WALLET_REPOSITORY } from './get-balance/interfaces/wallet.repository.interface';
import { WebhooksTopUpModule } from './webhooks-top-up/webhooks-top-up.module';
import { GetTransactionHistoryController } from './get-transaction-history/get-transaction-history.controller';
import { GetTransactionHistoryHandler } from './get-transaction-history/get-transaction-history.handler';
import { TRANSACTION_REPOSITORY } from './get-transaction-history/interfaces/transaction.repository.interface';
import { PostgresTransactionRepository } from './get-transaction-history/infrastructure/postgres.transaction.repository';

@Module({
  imports: [AuthModule, WebhooksTopUpModule],
  controllers: [GetBalanceController, GetTransactionHistoryController],
  providers: [
    GetBalanceHandler,
    {
      provide: WALLET_REPOSITORY,
      useClass: PostgresWalletRepository,
    },
    GetTransactionHistoryHandler,
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: PostgresTransactionRepository,
    },
  ],
  exports: [WebhooksTopUpModule],
})
export class WalletModule {}
