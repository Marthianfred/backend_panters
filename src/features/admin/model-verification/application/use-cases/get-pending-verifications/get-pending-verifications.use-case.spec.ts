import { Test, TestingModule } from '@nestjs/testing';
import { GetPendingVerificationsUseCase } from './get-pending-verifications.use-case';
import { AUTH_POOL_TOKEN } from '@/features/auth/infrastructure/auth.constants';
import { Pool } from 'pg';

describe('GetPendingVerificationsUseCase', () => {
  let useCase: GetPendingVerificationsUseCase;
  let mockPool: jest.Mocked<Pool>;

  beforeEach(async () => {
    mockPool = {
      query: jest.fn(),
    } as unknown as jest.Mocked<Pool>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetPendingVerificationsUseCase,
        { provide: AUTH_POOL_TOKEN, useValue: mockPool },
      ],
    }).compile();

    useCase = module.get<GetPendingVerificationsUseCase>(
      GetPendingVerificationsUseCase,
    );
  });

  it('debe retornar lista de verificaciones pendientes', async () => {
    const mockRows = [
      {
        id: '1',
        userId: 'u1',
        name: 'N1',
        email: 'e1',
        username: 'un1',
        status: 'PENDING',
        createdAt: new Date(),
      },
    ];
    mockPool.query.mockResolvedValue({ rows: mockRows });

    const result = await useCase.execute();

    expect(result).toEqual(mockRows);
    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining("WHERE mv.status = 'PENDING'"),
    );
  });
});
