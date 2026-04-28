import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  Res,
  HttpStatus,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { UploadAvatarHandler } from './upload-avatar.handler';
import { AuthGuard } from '../../auth/guards/auth.guard';
import type { AuthenticatedRequest } from '../../auth/types/auth.types';
import { AvatarUploadFailedError } from './upload-avatar.models';

@Controller('api/v1/profiles')
@UseGuards(AuthGuard)
export class UploadAvatarController {
  constructor(private readonly handler: UploadAvatarHandler) {}

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file')) 
  public async uploadAvatar(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), 
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp)' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<void> {
    try {
      if (!file) {
        res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: 'Archivo de imagen no proporcionado en el payload.' });
        return;
      }

      const userId = req.user.id;
      const response = await this.handler.execute({
        userId,
        fileBuffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
      });

      res.status(HttpStatus.OK).json({ data: response });
    } catch (error) {
      if (error instanceof AvatarUploadFailedError) {
        res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
        return;
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Error interno del servidor al procesar la subida del avatar.',
      });
    }
  }
}
