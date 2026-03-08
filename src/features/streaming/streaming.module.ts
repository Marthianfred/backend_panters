import { Module } from '@nestjs/common';
import { GetViewerAccessController } from './get-viewer-access/get-viewer-access.controller';
import { GetViewerAccessHandler } from './get-viewer-access/get-viewer-access.handler';
import { PostgresStreamRepository } from './get-viewer-access/infrastructure/postgres.stream.repository';
import { AwsKinesisVideoService } from './get-viewer-access/infrastructure/aws.kinesis.service';
import { AwsS3Service } from './get-viewer-access/infrastructure/aws.s3.service';
import { STREAM_REPOSITORY } from './get-viewer-access/interfaces/stream.repository.interface';
import { KINESIS_VIDEO_SERVICE } from './get-viewer-access/interfaces/kinesis.service.interface';
import { S3_SERVICE } from './get-viewer-access/interfaces/s3.service.interface';

// Feature: Send Gift (VSA)
import { SendGiftController } from './send-gift/send-gift.controller';
import { SendGiftHandler } from './send-gift/send-gift.handler';
import { SEND_GIFT_REPOSITORY } from './send-gift/interfaces/send-gift.repository.interface';
import { PostgresSendGiftRepository } from './send-gift/infrastructure/postgres.send-gift.repository';

// Feature: Refund Gift (VSA)
import { RefundGiftController } from './refund-gift/refund-gift.controller';
import { RefundGiftHandler } from './refund-gift/refund-gift.handler';
import { REFUND_GIFT_REPOSITORY } from './refund-gift/interfaces/refund-gift.repository.interface';
import { PostgresRefundGiftRepository } from './refund-gift/infrastructure/postgres.refund-gift.repository';

// Feature: List Gifts (VSA)
import { ListGiftsController } from './list-gifts/list-gifts.controller';
import { ListGiftsHandler } from './list-gifts/list-gifts.handler';
import { LIST_GIFTS_REPOSITORY } from './list-gifts/interfaces/list-gifts.repository.interface';
import { PostgresListGiftsRepository } from './list-gifts/infrastructure/postgres.list-gifts.repository';

import { LiveChatModule } from '../live-chat/live-chat.module';

@Module({
  imports: [LiveChatModule],
  controllers: [
    GetViewerAccessController,
    SendGiftController,
    RefundGiftController,
    ListGiftsController
  ],
  providers: [
    GetViewerAccessHandler,
    SendGiftHandler,
    RefundGiftHandler,
    ListGiftsHandler,
    {
      provide: STREAM_REPOSITORY,
      useClass: PostgresStreamRepository,
    },
    {
      provide: KINESIS_VIDEO_SERVICE,
      useClass: AwsKinesisVideoService,
    },
    {
      provide: S3_SERVICE,
      useClass: AwsS3Service,
    },
    {
      provide: SEND_GIFT_REPOSITORY,
      useClass: PostgresSendGiftRepository,
    },
    {
      provide: REFUND_GIFT_REPOSITORY,
      useClass: PostgresRefundGiftRepository,
    },
    {
      provide: LIST_GIFTS_REPOSITORY,
      useClass: PostgresListGiftsRepository,
    },
  ],
})
export class StreamingModule {}
