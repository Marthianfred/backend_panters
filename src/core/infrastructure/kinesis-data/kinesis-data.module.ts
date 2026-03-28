import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KinesisDataPublisherService } from './kinesis-data-publisher.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [KinesisDataPublisherService],
  exports: [KinesisDataPublisherService],
})
export class KinesisDataModule {}
