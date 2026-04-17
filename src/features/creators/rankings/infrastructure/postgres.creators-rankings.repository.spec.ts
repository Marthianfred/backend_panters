import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PostgresCreatorsRankingsRepository } from './postgres.creators-rankings.repository';
import { Pool } from 'pg';

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('PostgresCreatorsRankingsRepository', () => {
  let repository: PostgresCreatorsRankingsRepository;
  let pool: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostgresCreatorsRankingsRepository,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('postgresql://user:pass@localhost:5432/db'),
          },
        },
      ],
    }).compile();

    repository = module.get<PostgresCreatorsRankingsRepository>(PostgresCreatorsRankingsRepository);
    pool = new Pool();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should call pool.query with correct SQL and limit', async () => {
    const mockRows = [
      {
        userId: '1',
        username: 'user1',
        fullName: 'User One',
        avatarUrl: 'http://img.com/1.jpg',
        totalReactions: 10,
      },
    ];

    pool.query.mockResolvedValue({ rows: mockRows });

    const result = await repository.getTopCreators(5);

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining("WHERE r.name = 'model'"),
      [5]
    );
    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe('1');
    expect(result[0].totalReactions).toBe(10);
  });

  it('should map null avatarUrl correctly', async () => {
    const mockRows = [
      {
        userId: '2',
        username: 'user2',
        fullName: 'User Two',
        avatarUrl: null,
        totalReactions: 5,
      },
    ];

    pool.query.mockResolvedValue({ rows: mockRows });

    const result = await repository.getTopCreators(1);

    expect(result[0].avatarUrl).toBeNull();
  });
});
