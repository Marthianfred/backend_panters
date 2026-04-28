import { Controller, Get, UseGuards } from '@nestjs/common';
import { GetPantersHandler } from './get-panters.handler';
import { GetPantersResponse } from './get-panters.models';

import { AuthGuard } from '../../auth/guards/auth.guard';

@Controller('api/v1/panters')
export class GetPantersController {
  constructor(private readonly getPantersHandler: GetPantersHandler) {}

  @Get()
  @UseGuards(AuthGuard)
  public async getPanters(): Promise<GetPantersResponse> {
    return this.getPantersHandler.execute({});
  }

  @Get('ranking')
  @UseGuards(AuthGuard)
  public async getRanking(): Promise<GetPantersResponse> {
    return this.getPantersHandler.getRanking(6);
  }
}
