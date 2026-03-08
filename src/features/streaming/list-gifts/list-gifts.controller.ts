import { Controller, Get } from '@nestjs/common';
import { ListGiftsHandler } from './list-gifts.handler';
import { ListGiftsResponse } from './list-gifts.models';

@Controller('api/v1/gifts')
export class ListGiftsController {
  constructor(private readonly handler: ListGiftsHandler) {}

  @Get()
  public async getGifts(): Promise<ListGiftsResponse> {
    return await this.handler.execute();
  }
}
