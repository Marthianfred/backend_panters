import {
  Controller,
  Get,
  Param,
  UseGuards,
  Req,
  HttpStatus,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { GetMediaUrlHandler } from './get-media-url.handler';
import { AuthGuard } from '../../auth/guards/auth.guard';
import type { AuthenticatedRequest } from '../../auth/types/auth.types';
import {
  ContentAccessDeniedError,
  ContentNotFoundError,
} from './get-media-url.models';

@Controller('api/v1/content')
@UseGuards(AuthGuard)
export class GetMediaUrlController {
  constructor(private readonly handler: GetMediaUrlHandler) {}

  @Get(':contentId/media')
  public async getMedia(
    @Req() req: AuthenticatedRequest,
    @Param('contentId') contentId: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const subscriberId = req.user.id;

      const response = await this.handler.execute({
        contentId,
        subscriberId,
      });

      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      if (error instanceof ContentNotFoundError) {
        res.status(HttpStatus.NOT_FOUND).json({ error: error.message });
        return;
      }
      if (error instanceof ContentAccessDeniedError) {
        res.status(HttpStatus.FORBIDDEN).json({ error: error.message });
        return;
      }
      
      console.error('[GetMediaUrlController] Error:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Ocurrió un error al intentar obtener el contenido.',
      });
    }
  }
}
