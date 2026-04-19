import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import {
  KinesisVideoClient,
  CreateSignalingChannelCommand,
  DescribeSignalingChannelCommand,
  GetSignalingChannelEndpointCommand,
} from '@aws-sdk/client-kinesis-video';
import { IKinesisVideoService } from '../interfaces/kinesis.service.interface';
import { WebRTCCredentials } from '../get-viewer-access.models';

@Injectable()
export class AwsKinesisVideoService implements IKinesisVideoService {
  private stsClient: STSClient;
  private kvsClient: KinesisVideoClient;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>(
      'KN_STREAMS_REGION',
      'us-east-2',
    );

    const credentials = {
      accessKeyId: this.configService.getOrThrow<string>(
        'KN_STREAMS_ACCESS_KEY_ID',
      ),
      secretAccessKey: this.configService.getOrThrow<string>(
        'KN_STREAMS_SECRET_ACCESS_KEY',
      ),
    };

    this.stsClient = new STSClient({ region, credentials });
    this.kvsClient = new KinesisVideoClient({ region, credentials });
  }

  private async assumeRole(
    channelArn: string,
    role: 'MASTER' | 'VIEWER',
    userId: string,
  ): Promise<WebRTCCredentials> {
    const roleArn = this.configService.get<string>('KN_STREAMS_ROLE_ARN');

    if (!roleArn) {
      return {
        accessKeyId: this.configService.get<string>(
          'KN_STREAMS_ACCESS_KEY_ID',
        ) as string,
        secretAccessKey: this.configService.get<string>(
          'KN_STREAMS_SECRET_ACCESS_KEY',
        ) as string,
        sessionToken: '',
        expiration: new Date(Date.now() + 3600 * 1000),
      };
    }

    const policy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            role === 'MASTER'
              ? 'kinesisvideo:ConnectAsMaster'
              : 'kinesisvideo:ConnectAsViewer',
            'kinesisvideo:GetSignalingChannelEndpoint',
          ],
          Resource: channelArn,
        },
      ],
    });

    const command = new AssumeRoleCommand({
      RoleArn: roleArn,
      RoleSessionName: `Kinesis-WebRTC-${role}-${userId.substring(0, 10)}`,
      DurationSeconds: 3600,
      Policy: policy,
    });

    const response = await this.stsClient.send(command);

    return {
      accessKeyId: response.Credentials?.AccessKeyId as string,
      secretAccessKey: response.Credentials?.SecretAccessKey as string,
      sessionToken: response.Credentials?.SessionToken as string,
      expiration: response.Credentials?.Expiration as Date,
    };
  }

  public async generateViewerCredentials(
    channelArn: string,
    userId: string,
  ): Promise<WebRTCCredentials> {
    return this.assumeRole(channelArn, 'VIEWER', userId);
  }

  public async generateProducerCredentials(
    channelArn: string,
    userId: string,
  ): Promise<WebRTCCredentials> {
    return this.assumeRole(channelArn, 'MASTER', userId);
  }

  public async getSignalingEndpoint(
    channelArn: string,
    role: 'MASTER' | 'VIEWER',
  ): Promise<string> {
    const command = new GetSignalingChannelEndpointCommand({
      ChannelARN: channelArn,
      SingleMasterChannelEndpointConfiguration: {
        Protocols: ['WSS', 'HTTPS'],
        Role: role,
      },
    });

    const response = await this.kvsClient.send(command);
    const endpoint = response.ResourceEndpointList?.find((e) =>
      e.ResourceEndpoint?.startsWith('wss://'),
    )?.ResourceEndpoint;

    if (!endpoint) {
      throw new Error('No se pudo obtener el endpoint de señalización WSS.');
    }

    return endpoint;
  }

  public async createSignalingChannel(channelName: string): Promise<string> {
    try {
      const command = new CreateSignalingChannelCommand({
        ChannelName: channelName,
        ChannelType: 'SINGLE_MASTER',
      });
      const response = await this.kvsClient.send(command);
      return response.ChannelARN as string;
    } catch (error) {
      if (error.name === 'ResourceInUseException') {
        const describe = await this.kvsClient.send(
          new DescribeSignalingChannelCommand({ ChannelName: channelName }),
        );
        return describe.ChannelInfo?.ChannelARN as string;
      }
      throw error;
    }
  }
}

