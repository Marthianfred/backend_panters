import { Test, TestingModule } from '@nestjs/testing';
import { RegisterModelUseCase } from './register-model.use-case';
import { Pool, PoolClient } from 'pg';
import {
  BETTER_AUTH_TOKEN,
  AUTH_POOL_TOKEN,
} from '../../../infrastructure/auth.constants';
import { NotifyAdminsUseCase } from '@/features/notifications/application/use-cases/notify-admins.use-case';
import { BadRequestException } from '@nestjs/common';
import { BetterAuthInstance } from '@/features/auth/types/auth.types';
import { RegisterModelRequest } from './register-model.dto';

describe('RegisterModelUseCase', () => {
  let useCase: RegisterModelUseCase;
  let mockPool: jest.Mocked<Pool>;
  let mockAuthInstance: jest.Mocked<BetterAuthInstance>;
  let mockNotifyAdminsUseCase: jest.Mocked<NotifyAdminsUseCase>;
  let mockClient: jest.Mocked<PoolClient>;

  beforeEach(async () => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    } as unknown as jest.Mocked<PoolClient>;

    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient),
    } as unknown as jest.Mocked<Pool>;

    mockAuthInstance = {
      api: {
        signUpEmail: jest.fn(),
      },
    } as unknown as jest.Mocked<BetterAuthInstance>;

    mockNotifyAdminsUseCase = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<NotifyAdminsUseCase>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterModelUseCase,
        { provide: BETTER_AUTH_TOKEN, useValue: mockAuthInstance },
        { provide: AUTH_POOL_TOKEN, useValue: mockPool },
        { provide: NotifyAdminsUseCase, useValue: mockNotifyAdminsUseCase },
      ],
    }).compile();

    useCase = module.get<RegisterModelUseCase>(RegisterModelUseCase);
  });

  it('debe estar definido', () => {
    expect(useCase).toBeDefined();
  });

  it('debe registrar una modelo exitosamente', async () => {
    const registerData = {
      email: 'model@test.com',
      password: 'password123',
      name: 'Model Name',
      username: 'model_user',
      birthDate: '1990-01-01',
      gender: 'female',
      age: 34,
    };

    (mockAuthInstance.api.signUpEmail as jest.Mock).mockResolvedValue({
      user: { id: 'user-id', email: 'model@test.com', name: 'Model Name' },
      session: { id: 'session-id' },
    });

    mockClient.query.mockResolvedValue({ rows: [] });

    const result = await useCase.execute(registerData);

    expect(result.success).toBe(true);
    expect(mockAuthInstance.api.signUpEmail).toHaveBeenCalled();
    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    expect(mockNotifyAdminsUseCase.execute).toHaveBeenCalled();
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('debe lanzar BadRequestException si signUpEmail falla', async () => {
    (mockAuthInstance.api.signUpEmail as jest.Mock).mockResolvedValue(null);

    await expect(useCase.execute({} as RegisterModelRequest)).rejects.toThrow(
      BadRequestException,
    );
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalled();
  });
});
