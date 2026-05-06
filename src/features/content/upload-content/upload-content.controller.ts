import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpStatus,
  Res,
  Sse,
  Param,
  MessageEvent,
  Query,
} from '@nestjs/common';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { UploadContentHandler } from './upload-content.handler';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { Role } from '../../../core/auth/roles.enum';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { AuthGuard } from '../../auth/guards/auth.guard';
import type { AuthenticatedRequest } from '../../auth/types/auth.types';
import {
  InvalidPriceError,
  ProfileNotFoundError,
} from './upload-content.models';

@Controller('api/v1/content')
@UseGuards(AuthGuard, RolesGuard)
export class UploadContentController {
  constructor(private readonly handler: UploadContentHandler) {}

  @Sse('upload-status/:clientId')
  public uploadStatus(
    @Param('clientId') clientId: string,
  ): Observable<MessageEvent> {
    return this.handler.getStatusStream(clientId);
  }

  @Post('confirm/:contentId')
  @Roles(Role.MODEL, Role.ADMIN)
  public confirmUpload(
    @Param('contentId') contentId: string,
    @Query('clientId') clientId: string,
    @Res() res: Response,
  ): void {
    if (!clientId) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .json({ error: 'clientId es requerido para confirmar.' });
      return;
    }
    this.handler.confirmUpload(contentId, clientId);
    res.status(HttpStatus.OK).json({ success: true });
  }

  @Post('upload')
  @Roles(Role.MODEL, Role.ADMIN)
  public async upload(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      title: string;
      description: string;
      price: number;
      type?: string;
      mimeType: string;
      thumbnailMimeType?: string;
      accessType: string;
    },
    @Query('clientId') clientId: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      if (!req.user) {
        res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ error: 'Usuario no autenticado.' });
        return;
      }

      const creatorId = req.user.id;

      const response = await this.handler.execute({
        creatorId: creatorId,
        title: body.title,
        description: body.description,
        priceInPanterCoins: body.price,
        type: body.type,
        mimeType: body.mimeType,
        thumbnailMimeType: body.thumbnailMimeType,
        accessType: body.accessType,
        clientId: clientId,
      });

      res.status(HttpStatus.CREATED).json(response);
    } catch (error: unknown) {
      if (error instanceof InvalidPriceError) {
        res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
        return;
      }
      if (error instanceof ProfileNotFoundError) {
        res.status(HttpStatus.NOT_FOUND).json({ error: error.message });
        return;
      }
      console.error('[UploadContentController] Error:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Ocurrió un error subiendo metadatos';
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: message,
      });
    }
  }
}
