import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GetBalanceController } from './get-balance/get-balance.controller';
import { GetBalanceHandler } from './get-balance/get-balance.handler';
import { PostgresWalletRepository } from './get-balance/infrastructure/postgres.wallet.repository';
import { WALLET_REPOSITORY } from './get-balance/interfaces/wallet.repository.interface';
import { WebhooksTopUpModule } from './webhooks-top-up/webhooks-top-up.module';

@Module({
  imports: [AuthModule, WebhooksTopUpModule],
  controllers: [GetBalanceController],
  providers: [
    GetBalanceHandler,
    {
      provide: WALLET_REPOSITORY,
      useClass: PostgresWalletRepository,
    },
  ],
})
export class WalletModule {}
