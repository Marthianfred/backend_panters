import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KinesisClient, PutRecordCommand } from '@aws-sdk/client-kinesis';

@Injectable()
export class KinesisDataPublisherService implements OnModuleInit {
  private client: KinesisClient;
  private streamName: string;
  private readonly logger = new Logger(KinesisDataPublisherService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.client = new KinesisClient({
      region:
        this.configService.get<string>('KN_STREAMS_REGION') || 'us-east-1',
      credentials: {
        accessKeyId:
          this.configService.get<string>('KN_STREAMS_ACCESS_KEY_ID') || '',
        secretAccessKey:
          this.configService.get<string>('KN_STREAMS_SECRET_ACCESS_KEY') || '',
      },
    });
    this.streamName = this.configService.get<string>('KN_STREAMS_NAME') || '';
  }

  async publish(
    type: string,
    data: Record<string, unknown>,
    partitionKey: string,
  ): Promise<void> {
    const payload = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };

    const command = new PutRecordCommand({
      StreamName: this.streamName,
      Data: Buffer.from(JSON.stringify(payload)),
      PartitionKey: partitionKey,
    });

    try {
      await this.client.send(command);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error al publicar evento en Kinesis: ${message}`);
    }
  }
}
