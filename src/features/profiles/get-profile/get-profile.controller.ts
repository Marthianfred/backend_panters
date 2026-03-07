import {
  Controller,
  Get,
  Req,
  Res,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { GetProfileHandler } from './get-profile.handler';
import { ProfileNotFoundError } from './get-profile.models';
import { AuthGuard } from '../../auth/guards/auth.guard';

@Controller('api/v1/profiles')
@UseGuards(AuthGuard)
export class GetProfileController {
  constructor(private readonly handler: GetProfileHandler) {}

  @Get('me')
  async getProfile(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ error: 'Usuario no autenticado.' });
        return;
      }

      const response = await this.handler.execute({ userId });

      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      if (error instanceof ProfileNotFoundError) {
        res.status(HttpStatus.NOT_FOUND).json({ error: error.message });
        return;
      }

      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: 'Error interno del servidor.' });
    }
  }
}
