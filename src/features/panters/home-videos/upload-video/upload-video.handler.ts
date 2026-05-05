import { Injectable, Inject, MessageEvent } from '@nestjs/common';
import * as crypto from 'crypto';
import { Subject, Observable } from 'rxjs';
import { HOME_VIDEO_REPOSITORY } from '../interfaces/home-video.repository.interface';
import type { IHomeVideoRepository } from '../interfaces/home-video.repository.interface';
import { HOME_VIDEO_STORAGE_SERVICE } from '../interfaces/home-video-storage.service.interface';
import type { IHomeVideoStorageService } from '../interfaces/home-video-storage.service.interface';
import {
  UnsupportedMimeTypeError,
  UploadProgressData,
} from './upload-video.models';
import type { HomeVideoUploadResponse } from './upload-video.models';
import type { HomeVideo } from '../home-video.entity';

@Injectable()
export class UploadHomeVideoHandler {
  private readonly statusStreams = new Map<string, Subject<MessageEvent>>();

  constructor(
    @Inject(HOME_VIDEO_REPOSITORY)
    private readonly repository: IHomeVideoRepository,
    @Inject(HOME_VIDEO_STORAGE_SERVICE)
    private readonly storageService: IHomeVideoStorageService,
  ) {}

  public getStatusStream(clientId: string): Observable<MessageEvent> {
    let stream = this.statusStreams.get(clientId);
    if (!stream) {
      stream = new Subject<MessageEvent>();
      this.statusStreams.set(clientId, stream);
    }
    return stream.asObservable();
  }

  private emitStatus(clientId: string, data: UploadProgressData) {
    const stream = this.statusStreams.get(clientId);
    if (stream) {
      stream.next({ data } as MessageEvent);
    }
  }

  public async generateUploadUrl(
    clientId: string,
    mimeType: string,
  ): Promise<any> {
    const id = crypto.randomUUID();
    const extension = mimeType === 'video/webm' ? '.webm' : '.mp4';
    const key = `VideosLoopHome/${id}${extension}`;

    const uploadUrl = await this.storageService.getUploadPresignedUrl(
      key,
      mimeType,
    );

    this.emitStatus(clientId, {
      status: 'starting',
      progress: 10,
      message: 'URL de subida generada',
    });

    return { uploadUrl, key, clientId };
  }

  public async registerUpload(
    dto: any,
    clientId: string,
  ): Promise<HomeVideoUploadResponse> {
    this.emitStatus(clientId, {
      status: 'saving_db',
      progress: 80,
      message: 'Registrando en base de datos...',
    });

    try {
      const id = dto.key.split('/').pop().split('.')[0];

      const baseUrl =
        process.env.AWS_URL ||
        `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`;
      const url = `${baseUrl}/${dto.key}`;

      const video: HomeVideo = {
        id,
        key: dto.key,
        url,
        originalName: dto.originalName,
        mimeType: dto.mimeType,
        createdAt: new Date(),
      };

      await this.repository.save(video);

      const response = { id, url, key: dto.key };

      this.emitStatus(clientId, {
        status: 'completed',
        progress: 100,
        message: 'Video registrado con éxito',
        data: response,
      });

      this.statusStreams.get(clientId)?.complete();
      this.statusStreams.delete(clientId);

      return response;
    } catch (error) {
      this.emitStatus(clientId, {
        status: 'error',
        progress: 0,
        message: `Error al registrar: ${error.message}`,
      });
      this.statusStreams.get(clientId)?.complete();
      this.statusStreams.delete(clientId);
      throw error;
    }
  }

  public async execute(
    file: Express.Multer.File,
    clientId?: string,
  ): Promise<HomeVideoUploadResponse> {
    if (clientId) {
      this.emitStatus(clientId, {
        status: 'starting',
        progress: 10,
        message: 'Validando archivo...',
      });
    }

    if (file.mimetype !== 'video/webm') {
      if (clientId) {
        this.emitStatus(clientId, {
          status: 'error',
          progress: 0,
          message: 'Formato no soportado',
        });
        this.statusStreams.get(clientId)?.complete();
        this.statusStreams.delete(clientId);
      }
      throw new UnsupportedMimeTypeError(file.mimetype);
    }

    const id = crypto.randomUUID();
    const extension = '.webm';
    const key = `VideosLoopHome/${id}${extension}`;

    if (clientId) {
      this.emitStatus(clientId, {
        status: 'uploading_s3',
        progress: 30,
        message: 'Subiendo a AWS S3...',
      });
    }

    try {
      const url = await this.storageService.uploadVideo(file, key);

      if (clientId) {
        this.emitStatus(clientId, {
          status: 'saving_db',
          progress: 70,
          message: 'Registrando en base de datos...',
        });
      }

      const video: HomeVideo = {
        id,
        key,
        url,
        originalName: file.originalname,
        mimeType: file.mimetype,
        createdAt: new Date(),
      };

      await this.repository.save(video);

      const response = { id, url, key };

      if (clientId) {
        this.emitStatus(clientId, {
          status: 'completed',
          progress: 100,
          message: 'Subida completada con éxito',
          data: response,
        });
        this.statusStreams.get(clientId)?.complete();
        this.statusStreams.delete(clientId);
      }

      return response;
    } catch (error) {
      if (clientId) {
        this.emitStatus(clientId, {
          status: 'error',
          progress: 0,
          message: `Error en la subida: ${error.message}`,
        });
        this.statusStreams.get(clientId)?.complete();
        this.statusStreams.delete(clientId);
      }
      throw error;
    }
  }
}
