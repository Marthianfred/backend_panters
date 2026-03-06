import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { IKinesisVideoService } from '../interfaces/kinesis.service.interface';
import { WebRTCCredentials } from '../get-viewer-access.models';

@Injectable()
export class AwsKinesisVideoService implements IKinesisVideoService {
  private stsClient: STSClient;
  private roleArn: string;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    this.roleArn = this.configService.getOrThrow<string>(
      'AWS_KVS_VIEWER_ROLE_ARN',
    );
    this.stsClient = new STSClient({ region });
  }

  public async generateViewerCredentials(
    channelArn: string,
    userId: string,
  ): Promise<WebRTCCredentials> {
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'KvsViewerPolicy',
          Effect: 'Allow',
          Action: [
            'kinesisvideo:ConnectAsViewer',
            'kinesisvideo:DescribeSignalingChannel',
            'kinesisvideo:GetIceServerConfig',
            'kinesisvideo:GetSignalingChannelEndpoint',
          ],
          Resource: channelArn,
        },
      ],
    };

    const command = new AssumeRoleCommand({
      RoleArn: this.roleArn,
      RoleSessionName: `ViewerSession-${userId}`,
      Policy: JSON.stringify(policy),
      DurationSeconds: 3600,
    });

    const response = await this.stsClient.send(command);

    if (!response.Credentials) {
      throw new Error('No se pudieron generar las credenciales de AWS STS.');
    }

    return {
      accessKeyId: response.Credentials.AccessKeyId as string,
      secretAccessKey: response.Credentials.SecretAccessKey as string,
      sessionToken: response.Credentials.SessionToken as string,
      expiration: response.Credentials.Expiration as Date,
    };
  }
}
