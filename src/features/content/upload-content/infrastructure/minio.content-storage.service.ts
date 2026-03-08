import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IContentStorageService } from '../interfaces/content-storage.service.interface';

@Injectable()
export class MinioContentStorageService implements IContentStorageService {
  private s3Client: S3Client;
  private bucket: string;
  private endpoint: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.getOrThrow<string>('AWS_BUCKET');
    this.endpoint = this.configService.getOrThrow<string>('AWS_ENDPOINT');

    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_DEFAULT_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
      endpoint: this.endpoint,
      forcePathStyle:
        this.configService.get<string>('AWS_USE_PATH_STYLE_ENDPOINT') ===
        'true',
    });
  }

  public async getPresignedUploadUrl(
    userId: string,
    contentId: string,
    mimeType?: string,
  ): Promise<string> {
    const key = `${userId}/content/${contentId}.mp4`;

    const params: PutObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
    };
    if (mimeType) {
      params.ContentType = mimeType;
    }

    const command = new PutObjectCommand(params);

    // Expira en 1 hora (3600 segundos)
    return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  public async getPresignedDownloadUrl(
    userId: string,
    contentId: string,
  ): Promise<string> {
    const key = `${userId}/content/${contentId}.mp4`;

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    // Expira en 1 hora
    return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }
}
