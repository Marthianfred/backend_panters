import {
  Controller,
  Get,
  Param,
  Req,
  Res,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { GetViewerAccessHandler } from './get-viewer-access.handler';
import { StreamNotFoundError } from './get-viewer-access.models';
import { AuthGuard } from '../../auth/guards/auth.guard';
import type { AuthenticatedRequest } from '../../auth/types/auth.types';

@Controller('api/v1/streams')
@UseGuards(AuthGuard)
export class GetViewerAccessController {
  constructor(private readonly handler: GetViewerAccessHandler) {}

  @Get(':streamId/access')
  async getAccess(
    @Param('streamId') streamId: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const userId = req.user.id;

      if (!streamId) {
        res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: 'Faltan parámetros requeridos: streamId.' });
        return;
      }

      const response = await this.handler.execute({ streamId, userId });

      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      if (error instanceof StreamNotFoundError) {
        res.status(HttpStatus.NOT_FOUND).json({ error: error.message });
        return;
      }

      console.error('Error obteniendo acceso al stream:', error);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: 'Error interno del servidor procesando la solicitud.' });
    }
  }
}
