import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpStatus,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CreateStreamHandler } from './create-stream.handler';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { Role } from '../../../core/auth/roles.enum';
import type { AuthenticatedRequest } from '../../auth/types/auth.types';

@Controller('api/v1/streaming')
@UseGuards(AuthGuard, RolesGuard)
export class CreateStreamController {
  constructor(private readonly handler: CreateStreamHandler) {}

  @Post('create')
  @Roles(Role.PANTER, Role.MODEL, Role.ADMIN)
  public async createStream(
    @Req() req: AuthenticatedRequest,
    @Body() body: { title: string },
    @Res() res: Response,
  ): Promise<void> {
    try {
      const creatorId = req.user.id;

      const response = await this.handler.execute({
        creatorId,
        title: body.title,
      });

      res.status(HttpStatus.CREATED).json(response);
    } catch (error) {
      console.error('[CreateStreamController] Error:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Ocurrió un error al intentar crear el stream.',
      });
    }
  }
}
