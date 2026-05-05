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
import { SubscriptionGuard } from '../../../features/subscriptions/guards/subscription.guard';

@Controller('api/v1/content')
@UseGuards(AuthGuard, RolesGuard, SubscriptionGuard)
export class ListContentController {
  constructor(private readonly handler: ListContentHandler) {}

  @Get('list')
  @Roles(Role.SUBSCRIBER, Role.MODEL, Role.ADMIN)
  public async listContents(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Query('creatorId') creatorId: string,
    @Query('type') type: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ): Promise<void> {
    try {
      const userRole = req.user?.role || Role.SUBSCRIBER;

      const response = await this.handler.execute({
        creatorId,
        isSubscriber: (userRole as Role) === Role.SUBSCRIBER,
        subscriberId: req.user?.id,
        type,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      res.status(HttpStatus.OK).json(response);
    } catch {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Error consultando catálogo de contenidos.',
      });
    }
  }
}
