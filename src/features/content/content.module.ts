import { Module } from '@nestjs/common';
import { UploadContentController } from './upload-content/upload-content.controller';
import { UploadContentHandler } from './upload-content/upload-content.handler';
import { ListContentController } from './list-content/list-content.controller';
import { ListContentHandler } from './list-content/list-content.handler';
import { PurchaseContentController } from './purchase-content/purchase-content.controller';
import { PurchaseContentHandler } from './purchase-content/purchase-content.handler';
import { CONTENT_REPOSITORY_TOKEN } from './interfaces/content.repository.interface';
import { InMemoryContentRepository } from './infrastructure/in-memory.content.repository';
import { P2P_TRANSACTION_SERVICE_TOKEN } from './purchase-content/interfaces/p2p-transaction.service.interface';
import { MockP2PTransactionService } from './purchase-content/infrastructure/mock.p2ptransaction.service';

@Module({
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
      useClass: InMemoryContentRepository,
    },
    {
      provide: P2P_TRANSACTION_SERVICE_TOKEN,
      useClass: MockP2PTransactionService,
    },
  ],
})
export class ContentModule {}
