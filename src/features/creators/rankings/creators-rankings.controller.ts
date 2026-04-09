import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { CreatorsRankingsHandler } from './creators-rankings.handler';
import { CreatorRankingResponse } from './creators-rankings.models';

@Controller('api/v1/creators')
export class CreatorsRankingsController {
  constructor(private readonly handler: CreatorsRankingsHandler) {}

  @Get('top-rated')
  async getTopRated(
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ): Promise<CreatorRankingResponse[]> {
    return this.handler.handle(limit);
  }
}
