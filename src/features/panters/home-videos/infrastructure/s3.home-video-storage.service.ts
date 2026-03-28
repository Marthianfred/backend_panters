import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IHomeVideoStorageService } from '../interfaces/home-video-storage.service.interface';

@Injectable()
export class S3HomeVideoStorageService implements IHomeVideoStorageService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.getOrThrow<string>('AWS_BUCKET');
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_DEFAULT_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
      endpoint: this.configService.getOrThrow<string>('AWS_ENDPOINT'),
      forcePathStyle:
        this.configService.get<string>('AWS_USE_PATH_STYLE_ENDPOINT') ===
        'true',
    });
  }

  public async uploadVideo(
    file: Express.Multer.File,
    key: string,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);
    
    // Devolvemos la URL pública si el bucket es público o construimos la URL base
    const endpoint = this.configService.getOrThrow<string>('AWS_ENDPOINT');
    // Para entornos locales/minio con path style
    if (this.configService.get<string>('AWS_USE_PATH_STYLE_ENDPOINT') === 'true') {
      return `${endpoint}/${this.bucketName}/${key}`;
    }
    // Para S3 estándar
    return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
  }

  public async deleteVideo(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    await this.s3Client.send(command);
  }

  public async getPresignedUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    // Expira en 1 hora
    return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }
}
