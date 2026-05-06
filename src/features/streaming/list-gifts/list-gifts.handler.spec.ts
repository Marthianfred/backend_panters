import { Test, TestingModule } from '@nestjs/testing';
import { ListGiftsHandler } from './list-gifts.handler';
import {
  IListGiftsRepository,
  LIST_GIFTS_REPOSITORY,
} from './interfaces/list-gifts.repository.interface';
import { GiftDTO } from './list-gifts.models';

describe('ListGiftsHandler', () => {
  let handler: ListGiftsHandler;
  let mockRepository: jest.Mocked<IListGiftsRepository>;

  beforeEach(async () => {
    mockRepository = {
      getAllActiveGifts: jest.fn(),
    } as unknown as jest.Mocked<IListGiftsRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListGiftsHandler,
        { provide: LIST_GIFTS_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    handler = module.get<ListGiftsHandler>(ListGiftsHandler);
  });

  it('debe retornar la lista de regalos desde el repositorio', async () => {
    const mockGifts: GiftDTO[] = [
      {
        id: '1',
        name: 'Rosa',
        priceCoins: 5,
        icon: 'rose',
        animationUrl: 'rose-anim',
      },
      {
        id: '2',
        name: 'Diamante',
        priceCoins: 100,
        icon: 'diamond',
        animationUrl: 'diamond-anim',
      },
    ];
    (mockRepository.getAllActiveGifts as jest.Mock).mockResolvedValue(
      mockGifts,
    );

    const result = await handler.execute();

    expect(mockRepository.getAllActiveGifts).toHaveBeenCalled();
    expect(result.gifts).toEqual(mockGifts);
  });
});
