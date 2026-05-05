import { Injectable, Inject, MessageEvent } from '@nestjs/common';
import * as crypto from 'crypto';
import { Subject, Observable } from 'rxjs';
import type { IContentRepository } from '../interfaces/content.repository.interface';
import { CONTENT_REPOSITORY_TOKEN } from '../interfaces/content.repository.interface';
import type { IContentStorageService } from './interfaces/content-storage.service.interface';
import { CONTENT_STORAGE_SERVICE } from './interfaces/content-storage.service.interface';
import { PROFILE_REPOSITORY } from '@/features/profiles/get-profile/interfaces/profile.repository.interface';
import type { IProfileRepository } from '@/features/profiles/get-profile/interfaces/profile.repository.interface';
import type {
  UploadContentRequest,
  UploadContentResponse,
  UploadProgressData,
} from './upload-content.models';
import {
  InvalidPriceError,
  ProfileNotFoundError,
} from './upload-content.models';

@Injectable()
export class UploadContentHandler {
  private readonly statusStreams = new Map<string, Subject<MessageEvent>>();

  constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly contentRepository: IContentRepository,
    @Inject(CONTENT_STORAGE_SERVICE)
    private readonly storageService: IContentStorageService,
    @Inject(PROFILE_REPOSITORY)
    private readonly profileRepository: IProfileRepository,
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

  public async execute(
    request: UploadContentRequest,
  ): Promise<UploadContentResponse> {
    if (request.clientId) {
      this.emitStatus(request.clientId, {
        status: 'starting',
        progress: 10,
        message: 'Validando datos y preparando subida...',
      });
    }

    if (request.priceInPanterCoins < 0) {
      if (request.clientId) {
        this.emitStatus(request.clientId, {
          status: 'error',
          progress: 0,
          message: 'Precio inválido',
        });
      }
      throw new InvalidPriceError();
    }

    const profile = await this.profileRepository.getProfileByUserId(
      request.creatorId,
    );
    if (!profile) {
      if (request.clientId) {
        this.emitStatus(request.clientId, {
          status: 'error',
          progress: 0,
          message: 'Perfil no encontrado',
        });
      }
      throw new ProfileNotFoundError();
    }

    const contentId = crypto.randomUUID();
    const isVideo = !request.mimeType.startsWith('image/');

    if (request.clientId && isVideo) {
      this.emitStatus(request.clientId, {
        status: 'saving_db',
        progress: 30,
        message: 'Registrando metadatos en el sistema...',
      });
    }

    const extension = this.getExtension(request.mimeType);
    const mediaKey = `${request.creatorId}/content/${contentId}${extension}`;

    let thumbnailKey = '';
    let presignedThumbnailUploadUrl: string | undefined = undefined;

    if (request.thumbnailMimeType) {
      const thumbExt = this.getExtension(request.thumbnailMimeType);
      thumbnailKey = `${request.creatorId}/thumbnails/${contentId}${thumbExt}`;

      presignedThumbnailUploadUrl =
        await this.storageService.getPresignedUploadUrl(
          request.creatorId,
          contentId,
          request.thumbnailMimeType,
          'thumbnails',
        );
    }

    await this.contentRepository.saveContent({
      id: contentId,
      creatorId: request.creatorId,
      title: request.title,
      description: request.description,
      type: request.type || (isVideo ? 'video' : 'photo'),
      price: request.priceInPanterCoins,
      accessType: request.accessType,
      url: mediaKey,
      thumbnailUrl: thumbnailKey,
      createdAt: new Date(),
    });

    const presignedUploadUrl = await this.storageService.getPresignedUploadUrl(
      request.creatorId,
      contentId,
      request.mimeType,
    );

    if (request.clientId && isVideo) {
      this.emitStatus(request.clientId, {
        status: 'uploading_s3',
        progress: 60,
        message:
          'URLs de subida generadas. Esperando transferencia de archivo...',
      });
    }

    return {
      contentId,
      status: 'AWAITING_MEDIA',
      message:
        'Los metadatos fueron creados. Proceda a subir el archivo y la miniatura mediante las URLs provistas.',
      presignedUploadUrl,
      presignedThumbnailUploadUrl,
    };
  }

  public async confirmUpload(
    contentId: string,
    clientId: string,
  ): Promise<void> {
    const stream = this.statusStreams.get(clientId);
    if (!stream) return;

    this.emitStatus(clientId, {
      status: 'completed',
      progress: 100,
      message: 'Subida confirmada y contenido disponible.',
      data: { contentId },
    });

    stream.complete();
    this.statusStreams.delete(clientId);
  }

  private getExtension(mimeType: string): string {
    const mime = mimeType.toLowerCase();
    if (mime.includes('image/jpeg') || mime.includes('image/jpg'))
      return '.jpg';
    if (mime.includes('image/png')) return '.png';
    if (mime.includes('image/gif')) return '.gif';
    if (mime.includes('image/webp')) return '.webp';
    if (mime.includes('video/mp4')) return '.mp4';
    if (mime.includes('video/quicktime')) return '.mov';
    return '.mp4';
  }
}
