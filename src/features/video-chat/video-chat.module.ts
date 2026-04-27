import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VideoChatController } from './video-chat.controller';
import { RequestPrivateChatHandler } from './request-chat/request-private-chat.handler';
import { JoinPrivateChatHandler } from './join-chat/join-private-chat.handler';
import { PostgresVideoChatRepository } from './infrastructure/postgres.video-chat.repository';
import { VIDEO_CHAT_REPOSITORY } from './interfaces/video-chat.repository.interface';
import { StreamingModule } from '../streaming/streaming.module';
import { LiveChatModule } from '../live-chat/live-chat.module';
import { STREAM_REPOSITORY } from '../streaming/get-viewer-access/interfaces/stream.repository.interface';
import { PostgresStreamRepository } from '../streaming/get-viewer-access/infrastructure/postgres.stream.repository';
import { KINESIS_VIDEO_SERVICE } from '../streaming/get-viewer-access/interfaces/kinesis.service.interface';
import { AwsKinesisVideoService } from '../streaming/get-viewer-access/infrastructure/aws.kinesis.service';

@Module({
  imports: [ConfigModule, LiveChatModule],
  controllers: [VideoChatController],
  providers: [
    RequestPrivateChatHandler,
    JoinPrivateChatHandler,
    {
      provide: VIDEO_CHAT_REPOSITORY,
      useClass: PostgresVideoChatRepository,
    },
    {
      provide: STREAM_REPOSITORY,
      useClass: PostgresStreamRepository,
    },
    {
      provide: KINESIS_VIDEO_SERVICE,
      useClass: AwsKinesisVideoService,
    },
  ],
})
export class VideoChatModule {}
