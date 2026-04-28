import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadHomeVideoHandler } from './upload-video.handler';
import { HomeVideoUploadResponse, UnsupportedMimeTypeError } from './upload-video.models';

@Controller('api/v1/panters/home-videos')
export class UploadHomeVideoController {
  constructor(private readonly handler: UploadHomeVideoHandler) {}

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
  ): Promise<HomeVideoUploadResponse> {
    if (!file) {
      throw new HttpException('No se recibió ningún archivo.', HttpStatus.BAD_REQUEST);
    }
    try {
      return await this.handler.execute(file);
    } catch (error) {
      if (error instanceof UnsupportedMimeTypeError) {
        throw new HttpException(error.message, HttpStatus.UNSUPPORTED_MEDIA_TYPE);
      }
      throw new HttpException(
        'Falla del servidor al cargar el video.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
