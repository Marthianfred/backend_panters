import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { GetEarningsHistoryHandler } from './get-earnings-history.handler';
import { EarningsHistoryRequest, EarningsHistoryResponse } from './get-earnings-history.models';

@Controller('api/v1/earnings')
export class GetEarningsHistoryController {
  constructor(private readonly handler: GetEarningsHistoryHandler) {}

  @Get('history')
  public async getHistory(
    @Query('creatorId') creatorId: string, // El creatorId vendría del token en un guardia real
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<EarningsHistoryResponse> {
    const request: EarningsHistoryRequest = {
      creatorId,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    return await this.handler.execute(request);
  }
}
