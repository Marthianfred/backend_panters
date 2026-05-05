import { Test, TestingModule } from '@nestjs/testing';
import { GetPlatformRevenueHandler } from './get-platform-revenue.handler';
import type { IPlatformRevenueRepository } from './interfaces/platform-revenue-repository.interface';

describe('GetPlatformRevenueHandler', () => {
  let handler: GetPlatformRevenueHandler;
  let repository: IPlatformRevenueRepository;

  const mockRepository = {
    getRevenueMetrics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPlatformRevenueHandler,
        {
          provide: 'IPlatformRevenueRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<GetPlatformRevenueHandler>(GetPlatformRevenueHandler);
    repository = module.get<IPlatformRevenueRepository>(
      'IPlatformRevenueRepository',
    );
  });

  it('should be defined', () => {
    expect(handler).toBeDefined();
  });

  it('should correctly calculate revenue metrics including conversion to USD', async () => {
    const mockMetrics = {
      totalGrossPtc: 1000,
      totalPlatformPtc: 300,
      totalCreatorPtc: 700,
    };
    mockRepository.getRevenueMetrics.mockResolvedValue(mockMetrics);

    const query = { startDate: '2024-01-01', endDate: '2024-01-31' };

    const result = await handler.execute(query);

    expect(result.grossRevenue.ptc).toBe(1000);
    expect(result.grossRevenue.usd).toBe(100);
    expect(result.platformCommission.ptc).toBe(300);
    expect(result.platformCommission.usd).toBe(30);
    expect(result.creatorEarnings.ptc).toBe(700);
    expect(result.creatorEarnings.usd).toBe(70);
    expect(repository.getRevenueMetrics).toHaveBeenCalledWith(
      new Date(query.startDate),
      new Date(query.endDate),
    );
  });

  it('should handle zero revenue correctly', async () => {
    const mockMetrics = {
      totalGrossPtc: 0,
      totalPlatformPtc: 0,
      totalCreatorPtc: 0,
    };
    mockRepository.getRevenueMetrics.mockResolvedValue(mockMetrics);

    const result = await handler.execute({});

    expect(result.grossRevenue.ptc).toBe(0);
    expect(result.grossRevenue.usd).toBe(0);
  });
});
