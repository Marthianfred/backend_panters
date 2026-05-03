import { Test, TestingModule } from '@nestjs/testing';
import { Pool } from 'pg';
import { CheckUserActivityUseCase } from './check-user-activity.use-case';
import { AUTH_POOL_TOKEN } from '../../infrastructure/auth.constants';

describe('CheckUserActivityUseCase', () => {
  let useCase: CheckUserActivityUseCase;
  let pool: Pool;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckUserActivityUseCase,
        {
          provide: AUTH_POOL_TOKEN,
          useValue: {
            query: jest.fn(),
          },
        },
      ],
    }).compile();

    useCase = module.get<CheckUserActivityUseCase>(CheckUserActivityUseCase);
    pool = module.get<Pool>(AUTH_POOL_TOKEN);
  });

  it('debe estar definido', () => {
    expect(useCase).toBeDefined();
  });

  it('debe retornar true si el usuario existe y está activo', async () => {
    const userId = 'user-123';
    (pool.query as jest.Mock).mockResolvedValue({
      rows: [{ is_active: true }],
    });

    const result = await useCase.execute(userId);

    expect(result).toBe(true);
    expect(pool.query).toHaveBeenCalledWith(
      'SELECT is_active FROM "user" WHERE id = $1',
      [userId],
    );
  });

  it('debe retornar false si el usuario existe pero está inactivo', async () => {
    const userId = 'user-123';
    (pool.query as jest.Mock).mockResolvedValue({
      rows: [{ is_active: false }],
    });

    const result = await useCase.execute(userId);

    expect(result).toBe(false);
  });

  it('debe retornar false si el usuario no existe', async () => {
    const userId = 'user-not-found';
    (pool.query as jest.Mock).mockResolvedValue({
      rows: [],
    });

    const result = await useCase.execute(userId);

    expect(result).toBe(false);
  });
});
