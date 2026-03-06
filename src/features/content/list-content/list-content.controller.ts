import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ListContentHandler } from './list-content.handler';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { Role } from '../../../core/auth/roles.enum';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';

@Controller('api/v1/content')
@UseGuards(RolesGuard)
export class ListContentController {
  constructor(private readonly handler: ListContentHandler) {}

  @Get('list')
  @Roles(Role.SUBSCRIBER, Role.PANTER, Role.MODERATOR, Role.ADMIN)
  public async listContents(
    @Req() req: Request,
    @Res() res: Response,
    @Query('creatorId') creatorId?: string,
  ): Promise<void> {
    try {
      // Simula verificar rol del JWT en VSA
      const userRole = req.headers['x-mock-role'] || Role.SUBSCRIBER;

      const response = await this.handler.execute({
        creatorId,
        isSubscriber: userRole === Role.SUBSCRIBER,
      });

      res.status(HttpStatus.OK).json(response);
    } catch {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Error consultando catálogo de contenidos.',
      });
    }
  }
}
