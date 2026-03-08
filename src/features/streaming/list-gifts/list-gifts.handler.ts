import { Injectable, Inject } from '@nestjs/common';
import type { 
  IListGiftsRepository, 
} from './interfaces/list-gifts.repository.interface';
import { LIST_GIFTS_REPOSITORY } from './interfaces/list-gifts.repository.interface';
import { ListGiftsResponse } from './list-gifts.models';

@Injectable()
export class ListGiftsHandler {
  constructor(
    @Inject(LIST_GIFTS_REPOSITORY)
    private readonly repository: IListGiftsRepository,
  ) {}

  public async execute(): Promise<ListGiftsResponse> {
    const gifts = await this.repository.getAllActiveGifts();
    return { gifts };
  }
}
