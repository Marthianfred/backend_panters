import {
  Controller,
  Put,
  Req,
  Res,
  Body,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { UpdateProfileHandler } from './update-profile.handler';
import { ProfileUpdateFailedError } from './update-profile.models';
import { AuthGuard } from '../../auth/guards/auth.guard';
import type { AuthenticatedRequest } from '../../auth/types/auth.types';

export class UpdateProfileDto {
  fullName?: string;
  avatarUrl?: string;
  bio?: string;
}

@Controller('api/v1/profiles')
@UseGuards(AuthGuard)
export class UpdateProfileController {
  constructor(private readonly handler: UpdateProfileHandler) {}

  @Put('me')
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() body: UpdateProfileDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const userId = req.user.id;

      if (!userId) {
        res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ error: 'Usuario no autenticado.' });
        return;
      }

      const response = await this.handler.execute({
        userId,
        fullName: body.fullName,
        avatarUrl: body.avatarUrl,
        bio: body.bio,
      });

      res.status(HttpStatus.OK).json({ data: response });
    } catch (error) {
      if (error instanceof ProfileUpdateFailedError) {
        res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
        return;
      }

      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: 'Error interno del servidor.' });
    }
  }
}
