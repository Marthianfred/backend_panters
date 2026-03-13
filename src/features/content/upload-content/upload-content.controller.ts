import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpStatus,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { UploadContentHandler } from './upload-content.handler';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { Role } from '../../../core/auth/roles.enum';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { AuthGuard } from '../../auth/guards/auth.guard';
import type { AuthenticatedRequest } from '../../auth/types/auth.types';
import { InvalidPriceError } from './upload-content.models';

@Controller('api/v1/content')
@UseGuards(AuthGuard, RolesGuard)
export class UploadContentController {
  constructor(private readonly handler: UploadContentHandler) {}

  @Post('upload')
  @Roles(Role.PANTER, Role.ADMIN)
  public async upload(
    @Req() req: AuthenticatedRequest,
    @Body() body: { title: string; description: string; price: number, type?: string, mimeType: string, thumbnailMimeType?: string, accessType: string },
    @Res() res: Response,
  ): Promise<void> {
    try {
      const creatorId = req.user.id;

      if (!creatorId) {
        res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ error: 'Usuario no autenticado.' });
        return;
      }

      const response = await this.handler.execute({
        creatorId: creatorId,
        title: body.title,
        description: body.description,
        priceInPanterCoins: body.price,
        type: body.type,
        mimeType: body.mimeType,
        thumbnailMimeType: body.thumbnailMimeType,
        accessType: body.accessType,
      });

      res.status(HttpStatus.CREATED).json(response);
    } catch (error) {
      if (error instanceof InvalidPriceError) {
        res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
        return;
      }
      console.error('[UploadContentController] Error:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: error.message || 'Ocurrió un error subiendo metadatos',
      });
    }
  }
}
