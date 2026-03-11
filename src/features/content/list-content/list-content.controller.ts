import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import type { AuthenticatedRequest } from '../../../features/auth/types/auth.types';
import { ListContentHandler } from './list-content.handler';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { Role } from '../../../core/auth/roles.enum';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { AuthGuard } from '../../../features/auth/guards/auth.guard';

@Controller('api/v1/content')
@UseGuards(AuthGuard, RolesGuard)
export class ListContentController {
  constructor(private readonly handler: ListContentHandler) {}

  @Get('list')
  @Roles(Role.SUBSCRIBER, Role.PANTER, Role.MODERATOR, Role.ADMIN)
  public async listContents(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Query('creatorId') creatorId: string,
  ): Promise<void> {
    try {
      if (!creatorId) {
        res.status(HttpStatus.BAD_REQUEST).json({
          error: 'El parámetro creatorId es obligatorio.',
        });
        return;
      }

      // Obtener rol del usuario autenticado
      const userRole = req.user?.role || Role.SUBSCRIBER;

      const response = await this.handler.execute({
        creatorId,
        isSubscriber: (userRole as Role) === Role.SUBSCRIBER,
        subscriberId: req.user?.id,
      });

      res.status(HttpStatus.OK).json(response);
    } catch {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Error consultando catálogo de contenidos.',
      });
    }
  }
}
