import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandInput,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IContentStorageService } from '../interfaces/content-storage.service.interface';

@Injectable()
export class MinioContentStorageService implements IContentStorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private endpoint: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.getOrThrow<string>('AWS_BUCKET');
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
    folder: string = 'content',
  ): Promise<string> {
    const extension = this.getExtension(mimeType);
    const key = `${userId}/${folder}/${contentId}${extension}`;

    const params: PutObjectCommandInput = {
      Bucket: this.bucketName,
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
    extension: string = '.mp4',
    folder: string = 'content'
  ): Promise<string> {
    const key = `${userId}/${folder}/${contentId}${extension.startsWith('.') ? extension : '.' + extension}`; 

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  public async deleteContent(
    userId: string,
    contentId: string,
    extension: string = '.mp4',
    folder: string = 'content'
  ): Promise<void> {
    const key = `${userId}/${folder}/${contentId}${extension.startsWith('.') ? extension : '.' + extension}`;
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    try {
      await this.s3Client.send(command);
    } catch (error) {
      // Si el archivo no existe en S3, ignoramos el error para permitir que el borrado en BDD continúe
      console.warn(`[StorageService] No se pudo borrar el archivo en S3 (quizás no existe): ${key}`, error.message);
    }
  }

  private getExtension(mimeType?: string): string {
    if (!mimeType) return '.mp4';
    const mime = mimeType.toLowerCase();
    if (mime.includes('image/jpeg') || mime.includes('image/jpg')) return '.jpg';
    if (mime.includes('image/png')) return '.png';
    if (mime.includes('image/gif')) return '.gif';
    if (mime.includes('image/webp')) return '.webp';
    if (mime.includes('video/mp4')) return '.mp4';
    if (mime.includes('video/quicktime')) return '.mov';
    if (mime.includes('video/webm')) return '.webm';
    return '.mp4'; // Default
  }
}
