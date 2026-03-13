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
    const region = this.configService.get<string>('KN_AWS_REGION', 'us-east-1');
    const endpoint = this.configService.get<string>('KN_AWS_ENDPOINT');

    this.roleArn = this.configService.getOrThrow<string>(
      'KN_AWS_KVS_VIEWER_ROLE_ARN',
    );

    // Configuración ajustada para LocalStack
    this.stsClient = new STSClient({
      region,
      endpoint: endpoint,
      credentials: {
        accessKeyId: this.configService.get<string>('KN_AWS_ACCESS_KEY_ID', 'test'),
        secretAccessKey: this.configService.get<string>(
          'KN_AWS_SECRET_ACCESS_KEY',
          'test',
        ),
      },
    });
  }

  public async generateViewerCredentials(
    channelArn: string,
    userId: string,
  ): Promise<WebRTCCredentials> {
    /*
    // --- CÓDIGO ORIGINAL DE AWS KINESIS COMENTADO ---
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
    // ------------------------------------------------
    */

    // REEMPLAZO PARA LOCALSTACK / DESARROLLO LOCAL
    // Retornamos credenciales estáticas de prueba que funcionan con el contenedor de LocalStack
    return {
      accessKeyId: 'test',
      secretAccessKey: 'test',
      sessionToken: 'localstack-mock-session-token',
      expiration: new Date(Date.now() + 3600 * 1000), // 1 hora de validez
    };
  }

  public async createSignalingChannel(channelName: string): Promise<string> {
    // Para LocalStack retornamos un ARN simulado basado en el nombre
    return `arn:aws:kinesisvideo:us-east-1:000000000000:signaling-channel/${channelName}/1234567890123`;
  }
}
