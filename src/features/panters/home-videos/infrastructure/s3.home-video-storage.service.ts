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
    onProgress?: (bytesSent: number, totalBytes: number) => void,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.size,
      });

      if (onProgress) {
        onProgress(Math.floor(file.size * 0.5), file.size);
      }

      await this.s3Client.send(command);

      if (onProgress) {
        onProgress(file.size, file.size);
      }

      return `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    } catch (error: unknown) {
      console.error('Error al subir video a S3:', error);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`No se pudo subir el video a S3: ${message}`);
    }
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

    return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  public async getUploadPresignedUrl(
    key: string,
    contentType: string,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn: 600 });
  }
}
