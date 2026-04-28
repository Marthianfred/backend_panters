import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { IAvatarStorageService } from '../interfaces/avatar-storage.service.interface';

@Injectable()
export class MinioAvatarStorageService implements IAvatarStorageService {
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

  public async uploadAvatar(
    userId: string,
    originalName: string,
    mimeType: string,
    fileBuffer: Buffer,
  ): Promise<string> {
    
    
    const key = `${userId}/avatars/profile_picture.webp`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      CacheControl: 'max-age=0, no-cache, no-store, must-revalidate', 
    });

    await this.s3Client.send(command);

    const publicUrlBase = this.configService.get<string>('AWS_URL');

    if (publicUrlBase) {
      
      const formattedBase = publicUrlBase.endsWith('/')
        ? publicUrlBase.slice(0, -1)
        : publicUrlBase;
      return `${formattedBase}/${key}`;
    }

    return `${this.endpoint}/${this.bucket}/${key}`;
  }
}
