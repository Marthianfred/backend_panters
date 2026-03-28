import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { KinesisVideoClient, CreateSignalingChannelCommand, DeleteSignalingChannelCommand, DescribeSignalingChannelCommand, GetSignalingChannelEndpointCommand } from '@aws-sdk/client-kinesis-video';
import { IKinesisVideoService } from '../interfaces/kinesis.service.interface';
import { WebRTCCredentials } from '../get-viewer-access.models';

@Injectable()
export class AwsKinesisVideoService implements IKinesisVideoService {
  private stsClient: STSClient;
  private kvsClient: KinesisVideoClient;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('KN_STREAMS_REGION', 'us-east-2');

    const credentials = {
      accessKeyId: this.configService.getOrThrow<string>('KN_STREAMS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.getOrThrow<string>('KN_STREAMS_SECRET_ACCESS_KEY'),
    };

    this.stsClient = new STSClient({ region, credentials });
    this.kvsClient = new KinesisVideoClient({ region, credentials });
  }

  public async generateViewerCredentials(
    channelArn: string,
    userId: string,
  ): Promise<WebRTCCredentials> {
    // Para visualización retornamos credenciales directas para el PoC con permisos limitados si fuera posible, 
    // pero por ahora usaremos las principales filtradas por el cliente WebRTC.
    return {
      accessKeyId: this.configService.get<string>('KN_STREAMS_ACCESS_KEY_ID') as string,
      secretAccessKey: this.configService.get<string>('KN_STREAMS_SECRET_ACCESS_KEY') as string,
      sessionToken: '',
      expiration: new Date(Date.now() + 3600 * 1000), 
    };
  }

  public async generateProducerCredentials(
    channelArn: string,
    userId: string,
  ): Promise<WebRTCCredentials> {
    return {
      accessKeyId: this.configService.get<string>('KN_STREAMS_ACCESS_KEY_ID') as string,
      secretAccessKey: this.configService.get<string>('KN_STREAMS_SECRET_ACCESS_KEY') as string,
      sessionToken: '',
      expiration: new Date(Date.now() + 3600 * 1000), 
    };
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
        const describe = await this.kvsClient.send(new DescribeSignalingChannelCommand({ ChannelName: channelName }));
        return describe.ChannelInfo?.ChannelARN as string;
      }
      throw error;
    }
  }
}
