import { GiftDTO } from '../list-gifts.models';

export interface IListGiftsRepository {
  getAllActiveGifts(): Promise<GiftDTO[]>;
}

export const LIST_GIFTS_REPOSITORY = Symbol('LIST_GIFTS_REPOSITORY');
