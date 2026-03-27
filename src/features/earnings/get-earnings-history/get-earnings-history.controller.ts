import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { GetEarningsHistoryHandler } from './get-earnings-history.handler';
import { EarningsHistoryRequest, EarningsHistoryResponse } from './get-earnings-history.models';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { Role } from '../../../core/auth/roles.enum';
import type { AuthenticatedRequest } from '../../auth/types/auth.types';

@Controller('api/v1/earnings')
@UseGuards(AuthGuard, RolesGuard)
export class GetEarningsHistoryController {
  constructor(private readonly handler: GetEarningsHistoryHandler) {}

  @Get('history')
  @Roles(Role.PANTER, Role.MODEL)
  public async getHistory(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<EarningsHistoryResponse> {
    const request: EarningsHistoryRequest = {
      creatorId: req.user.id,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    return await this.handler.execute(request);
  }
}
