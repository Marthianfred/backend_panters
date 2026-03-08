import { Test, TestingModule } from '@nestjs/testing';
import { GetEarningsHistoryHandler } from './get-earnings-history.handler';
import { EARNINGS_REPOSITORY_TOKEN } from '../interfaces/earnings.repository.interface';

describe('GetEarningsHistoryHandler', () => {
  let handler: GetEarningsHistoryHandler;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      getCreatorEarningsHistory: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetEarningsHistoryHandler,
        { provide: EARNINGS_REPOSITORY_TOKEN, useValue: mockRepository },
      ],
    }).compile();

    handler = module.get<GetEarningsHistoryHandler>(GetEarningsHistoryHandler);
  });

  it('debe llamar al repositorio con los parámetros correctos', async () => {
    const request = { creatorId: 'c1', page: 1, limit: 10 };
    const mockResponse = {
      transactions: [],
      totalCount: 0,
      currentPage: 1,
      totalPages: 0
    };
    mockRepository.getCreatorEarningsHistory.mockResolvedValue(mockResponse);

    const result = await handler.execute(request);

    expect(mockRepository.getCreatorEarningsHistory).toHaveBeenCalledWith(request);
    expect(result).toEqual(mockResponse);
  });
});
