import {
  Controller,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  HttpStatus,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { UpdateContentHandler } from './update-content.handler';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { Role } from '../../../core/auth/roles.enum';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { AuthGuard } from '../../auth/guards/auth.guard';
import type { AuthenticatedRequest } from '../../auth/types/auth.types';
import {
  ContentNotFoundError,
  UnauthorizedUpdateError,
} from './update-content.models';

@Controller('api/v1/content')
@UseGuards(AuthGuard, RolesGuard)
export class UpdateContentController {
  constructor(private readonly handler: UpdateContentHandler) {}

  @Patch(':contentId')
  @Roles(Role.PANTER, Role.MODEL, Role.ADMIN)
  public async updateContent(
    @Req() req: AuthenticatedRequest,
    @Param('contentId') contentId: string,
    @Body() body: { title?: string; description?: string; price?: number, accessType?: string },
    @Res() res: Response,
  ): Promise<void> {
    try {
      const creatorId = req.user.id;

      const response = await this.handler.execute({
        contentId,
        creatorId,
        updates: body,
      });

      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      if (error instanceof ContentNotFoundError) {
        res.status(HttpStatus.NOT_FOUND).json({ error: error.message });
        return;
      }
      if (error instanceof UnauthorizedUpdateError) {
        res.status(HttpStatus.FORBIDDEN).json({ error: error.message });
        return;
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Ocurrió un error al intentar actualizar el contenido.',
      });
    }
  }
}
