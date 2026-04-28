import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KinesisClient, PutRecordCommand } from '@aws-sdk/client-kinesis';
import { IPostReactionEventPublisher } from '../interfaces/post-reactions-event-publisher.interface';
import { PostReactionEvent } from '../post-reactions.models';

@Injectable()
export class AwsKinesisWallReactionPublisher implements IPostReactionEventPublisher {
  private readonly kinesisClient: KinesisClient;
  private readonly streamName: string;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('KN_AWS_REGION', 'us-east-1');
    const endpoint = this.configService.get<string>('KN_AWS_ENDPOINT');

    this.streamName = this.configService.get<string>(
      'KN_KINESIS_WALL_REACTIONS_STREAM',
      'wall-post-reactions-stream'
    );

    this.kinesisClient = new KinesisClient({
      region,
      endpoint: endpoint,
      credentials: {
        accessKeyId: this.configService.get<string>('KN_AWS_ACCESS_KEY_ID', 'test'),
        secretAccessKey: this.configService.get<string>(
          'KN_AWS_SECRET_ACCESS_KEY',
          'test'
        ),
      },
    });
  }

  async publish(event: PostReactionEvent): Promise<void> {
    const payload = JSON.stringify({
      eventType: 'WALL_POST_REACTION_ADDED', 
      data: event,
      meta: {
        vsa_path: 'panters/post-reactions',
        version: '1.1.0'
      }
    });

    try {
      const command = new PutRecordCommand({
        StreamName: this.streamName,
        Data: Buffer.from(payload),
        PartitionKey: event.creatorId, 
      });

      await this.kinesisClient.send(command);
    } catch (error) {
      
      console.error('[Kinesis/Wall] Fallo la publicación de pantera:', error.message);
    }
  }
}
