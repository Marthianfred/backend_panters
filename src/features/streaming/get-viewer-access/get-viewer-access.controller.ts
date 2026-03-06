import { Controller, Get, Param, Req, Res, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { GetViewerAccessHandler } from './get-viewer-access.handler';
import { StreamNotFoundError } from './get-viewer-access.models';

@Controller('api/v1/streams')
export class GetViewerAccessController {
  constructor(private readonly handler: GetViewerAccessHandler) {}

  @Get(':streamId/access')
  async getAccess(
    @Param('streamId') streamId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Usaremos un dummy para el usuario por ahora, en un modelo real lo toma del jwt.
      // Assuming a middleware sets `req.user`
      const userId = (req as any).user?.id || 'anonymous-user';

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
