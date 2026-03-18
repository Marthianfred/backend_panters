import { Body, Controller, Get, Param, Post, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '../../auth/guards/auth.guard';
import type { AuthenticatedRequest } from '../../auth/types/auth.types';
import { RatePanterHandler } from './rate-panter.handler';
import { RatePanterRequest, RatePanterResponse, GetPanterRatingSummaryResponse } from './rate-panter.models';

@Controller('api/v1/panters')
export class RatePanterController {
  constructor(private readonly handler: RatePanterHandler) {}

  @Post('rate')
  @UseGuards(AuthGuard)
  async rate(
    @Request() req: AuthenticatedRequest,
    @Body() body: RatePanterRequest
  ): Promise<RatePanterResponse> {
    const subscriberId = req.user.id; 
    return await this.handler.execute(subscriberId, body);
  }

  @Get(':id/rating')
  async getRating(@Param('id') id: string): Promise<GetPanterRatingSummaryResponse> {
    return await this.handler.getSummary(id);
  }
}
