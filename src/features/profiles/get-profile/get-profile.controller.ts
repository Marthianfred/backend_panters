import {
  Controller,
  Get,
  Req,
  Res,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { GetProfileHandler } from './get-profile.handler';
import { ProfileNotFoundError } from './get-profile.models';
import { AuthGuard } from '../../auth/guards/auth.guard';
import type { AuthenticatedRequest } from '../../auth/types/auth.types';

@Controller('api/v1/profiles')
@UseGuards(AuthGuard)
export class GetProfileController {
  constructor(private readonly handler: GetProfileHandler) {}

  @Get('me')
  async getProfile(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const userId = req.user.id;
      const role = req.user.role;

      if (!userId) {
        res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ error: 'Usuario no autenticado.' });
        return;
      }

      const response = await this.handler.execute({ userId });

      // Adjuntar el rol de la sesión al perfil
      const profileWithRole = {
        ...response,
        role: role,
      };

      res.status(HttpStatus.OK).json(profileWithRole);
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
