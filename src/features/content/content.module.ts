import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UploadContentController } from './upload-content/upload-content.controller';
import { UploadContentHandler } from './upload-content/upload-content.handler';
import { ListContentController } from './list-content/list-content.controller';
import { ListContentHandler } from './list-content/list-content.handler';
import { PurchaseContentController } from './purchase-content/purchase-content.controller';
import { PurchaseContentHandler } from './purchase-content/purchase-content.handler';
import { CONTENT_REPOSITORY_TOKEN } from './interfaces/content.repository.interface';
import { PostgresContentRepository } from './infrastructure/postgres.content.repository';
import { P2P_TRANSACTION_SERVICE_TOKEN } from './purchase-content/interfaces/p2p-transaction.service.interface';
import { PostgresP2PTransactionService } from './purchase-content/infrastructure/postgres.p2p.service';

@Module({
  imports: [AuthModule],
  controllers: [
    UploadContentController,
    ListContentController,
    PurchaseContentController,
  ],
  providers: [
    UploadContentHandler,
    ListContentHandler,
    PurchaseContentHandler,
    {
      provide: CONTENT_REPOSITORY_TOKEN,
      useClass: PostgresContentRepository,
    },
    {
      provide: P2P_TRANSACTION_SERVICE_TOKEN,
      useClass: PostgresP2PTransactionService,
    },
  ],
})
export class ContentModule {}
