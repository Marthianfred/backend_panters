import { Test, TestingModule } from '@nestjs/testing';
import { CreatorsRankingsHandler } from './creators-rankings.handler';
import { CREATORS_RANKINGS_REPOSITORY, ICreatorsRankingsRepository } from './infrastructure/postgres.creators-rankings.repository';

describe('CreatorsRankingsHandler', () => {
  let handler: CreatorsRankingsHandler;
  let repository: jest.Mocked<ICreatorsRankingsRepository>;

  beforeEach(async () => {
    const mockRepository: jest.Mocked<ICreatorsRankingsRepository> = {
      getTopCreators: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatorsRankingsHandler,
        {
          provide: CREATORS_RANKINGS_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<CreatorsRankingsHandler>(CreatorsRankingsHandler);
    repository = module.get(CREATORS_RANKINGS_REPOSITORY);
  });

  it('should return top creators with their reactions and ranking score', async () => {
    const mockData = [
      {
        userId: 'girl-1',
        username: 'queen1',
        fullName: 'Queen Bee',
        avatarUrl: 'http://img.com/1.jpg',
        totalReactions: 500,
      },
      {
        userId: 'girl-2',
        username: 'star2',
        fullName: 'Star Girl',
        avatarUrl: null,
        totalReactions: 300,
      },
    ];

    repository.getTopCreators.mockResolvedValue(mockData);

    const result = await handler.handle(2);

    expect(result).toHaveLength(2);
    expect(result[0].userId).toBe('girl-1');
    expect(result[0].totalReactions).toBe(500);
    expect(result[0].rating).toBe(500); 
    expect(repository.getTopCreators).toHaveBeenCalledWith(2);
  });

  it('should handle creators without avatar', async () => {
    const mockData = [
      {
        userId: 'girl-2',
        username: 'star2',
        fullName: 'Star Girl',
        avatarUrl: null,
        totalReactions: 10,
      },
    ];

    repository.getTopCreators.mockResolvedValue(mockData);

    const result = await handler.handle(1);

    expect(result[0].avatarUrl).toBeUndefined();
  });
});
