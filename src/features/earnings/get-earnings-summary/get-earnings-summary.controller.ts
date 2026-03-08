import {
  Controller,
  Get,
  UseGuards,
  Req,
  HttpStatus,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { GetEarningsSummaryHandler } from './get-earnings-summary.handler';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { Role } from '../../../core/auth/roles.enum';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { AuthGuard } from '../../auth/guards/auth.guard';
import type { AuthenticatedRequest } from '../../auth/types/auth.types';

@Controller('api/v1/earnings')
@UseGuards(AuthGuard, RolesGuard)
export class GetEarningsSummaryController {
  constructor(private readonly handler: GetEarningsSummaryHandler) {}

  @Get('summary')
  @Roles(Role.PANTER) // Solo las Chicas Panters pueden ver sus propios ingresos
  public async getSummary(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const creatorId = req.user.id;
      const response = await this.handler.execute(creatorId);
      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Error consultando el resumen de ingresos.',
      });
    }
  }
}
