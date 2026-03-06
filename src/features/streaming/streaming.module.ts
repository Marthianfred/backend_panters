import { Module } from '@nestjs/common';
import { GetViewerAccessController } from './get-viewer-access/get-viewer-access.controller';
import { GetViewerAccessHandler } from './get-viewer-access/get-viewer-access.handler';
import { PostgresStreamRepository } from './get-viewer-access/infrastructure/postgres.stream.repository';
import { AwsKinesisVideoService } from './get-viewer-access/infrastructure/aws.kinesis.service';
import { AwsS3Service } from './get-viewer-access/infrastructure/aws.s3.service';
import { STREAM_REPOSITORY } from './get-viewer-access/interfaces/stream.repository.interface';
import { KINESIS_VIDEO_SERVICE } from './get-viewer-access/interfaces/kinesis.service.interface';
import { S3_SERVICE } from './get-viewer-access/interfaces/s3.service.interface';

@Module({
  controllers: [GetViewerAccessController],
  providers: [
    GetViewerAccessHandler,
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
  ],
})
export class StreamingModule {}
