import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProfilesModule } from '../profiles/profiles.module';
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

import { CONTENT_STORAGE_SERVICE } from './upload-content/interfaces/content-storage.service.interface';
import { MinioContentStorageService } from './upload-content/infrastructure/minio.content-storage.service';
import { UpdateContentController } from './update-content/update-content.controller';
import { UpdateContentHandler } from './update-content/update-content.handler';
import { DeleteContentController } from './delete-content/delete-content.controller';
import { DeleteContentHandler } from './delete-content/delete-content.handler';
import { GetMediaUrlController } from './get-media-url/get-media-url.controller';
import { GetMediaUrlHandler } from './get-media-url/get-media-url.handler';

@Module({
  imports: [AuthModule, ProfilesModule],
  controllers: [
    UploadContentController,
    ListContentController,
    PurchaseContentController,
    UpdateContentController,
    DeleteContentController,
    GetMediaUrlController,
  ],
  providers: [
    UploadContentHandler,
    ListContentHandler,
    PurchaseContentHandler,
    UpdateContentHandler,
    DeleteContentHandler,
    GetMediaUrlHandler,
    {
      provide: CONTENT_REPOSITORY_TOKEN,
      useClass: PostgresContentRepository,
    },
    {
      provide: P2P_TRANSACTION_SERVICE_TOKEN,
      useClass: PostgresP2PTransactionService,
    },
    {
      provide: CONTENT_STORAGE_SERVICE,
      useClass: MinioContentStorageService,
    },
  ],
})
export class ContentModule {}
