import { Test, TestingModule } from '@nestjs/testing';
import { ListGiftsHandler } from './list-gifts.handler';
import { LIST_GIFTS_REPOSITORY } from './interfaces/list-gifts.repository.interface';

describe('ListGiftsHandler', () => {
  let handler: ListGiftsHandler;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      getAllActiveGifts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListGiftsHandler,
        { provide: LIST_GIFTS_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    handler = module.get<ListGiftsHandler>(ListGiftsHandler);
  });

  it('debe retornar la lista de regalos desde el repositorio', async () => {
    const mockGifts = [
      { id: '1', name: 'Rosa', priceCoins: 5, icon: 'rose' },
      { id: '2', name: 'Diamante', priceCoins: 100, icon: 'diamond' },
    ];
    mockRepository.getAllActiveGifts.mockResolvedValue(mockGifts);

    const result = await handler.execute();

    expect(mockRepository.getAllActiveGifts).toHaveBeenCalled();
    expect(result.gifts).toEqual(mockGifts);
  });
});
