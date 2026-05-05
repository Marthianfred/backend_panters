import {
  Controller,
  Post,
  Get,
  Body,
  UploadedFile,
  UseInterceptors,
  HttpStatus,
  HttpException,
  Query,
  Sse,
  Param,
  MessageEvent,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Observable } from 'rxjs';
import { UploadHomeVideoHandler } from './upload-video.handler';
import {
  RegisterUploadDto,
  UnsupportedMimeTypeError,
} from './upload-video.models';
import type {
  HomeVideoUploadResponse,
  HomeVideoUploadUrlResponse,
} from './upload-video.models';

@Controller('api/v1/panters/home-videos')
export class UploadHomeVideoController {
  constructor(private readonly handler: UploadHomeVideoHandler) {}

  @Sse('upload-status/:clientId')
  public uploadStatus(
    @Param('clientId') clientId: string,
  ): Observable<MessageEvent> {
    return this.handler.getStatusStream(clientId);
  }

  @Get('upload-url')
  public async getUploadUrl(
    @Query('clientId') clientId: string,
    @Query('mimeType') mimeType: string,
  ): Promise<HomeVideoUploadUrlResponse> {
    if (!clientId || !mimeType) {
      throw new HttpException(
        'clientId y mimeType son requeridos.',
        HttpStatus.BAD_REQUEST,
      );
    }
    return await this.handler.generateUploadUrl(clientId, mimeType);
  }

  @Post('register')
  public async registerUpload(
    @Body() dto: RegisterUploadDto,
    @Query('clientId') clientId: string,
  ): Promise<HomeVideoUploadResponse> {
    if (!clientId) {
      throw new HttpException('clientId es requerido.', HttpStatus.BAD_REQUEST);
    }
    return await this.handler.registerUpload(dto, clientId);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('video', {
      limits: {
        fileSize: 100 * 1024 * 1024,
      },
    }),
  )
  public async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('clientId') clientId?: string,
  ): Promise<HomeVideoUploadResponse> {
    if (!file) {
      throw new HttpException(
        'No se recibió ningún archivo.',
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      return await this.handler.execute(file, clientId);
    } catch (error) {
      if (error instanceof UnsupportedMimeTypeError) {
        throw new HttpException(
          error.message,
          HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        );
      }
      throw new HttpException(
        'Falla del servidor al cargar el video.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
