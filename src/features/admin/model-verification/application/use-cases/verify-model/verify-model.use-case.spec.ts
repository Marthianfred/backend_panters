import { Test, TestingModule } from '@nestjs/testing';
import { VerifyModelUseCase } from './verify-model.use-case';
import { AUTH_POOL_TOKEN } from '@/features/auth/infrastructure/auth.constants';
import { NotifyUserUseCase } from '@/features/notifications/application/use-cases/notify-user.use-case';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { VerificationDecision, VerifyModelRequest } from './verify-model.dto';
import { Pool, PoolClient } from 'pg';

describe('VerifyModelUseCase', () => {
  let useCase: VerifyModelUseCase;
  let mockPool: jest.Mocked<Pool>;
  let mockNotifyUserUseCase: jest.Mocked<NotifyUserUseCase>;
  let mockClient: jest.Mocked<PoolClient>;

  beforeEach(async () => {
    mockClient = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    } as unknown as jest.Mocked<PoolClient>;

    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient),
    } as unknown as jest.Mocked<Pool>;

    mockNotifyUserUseCase = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<NotifyUserUseCase>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerifyModelUseCase,
        { provide: AUTH_POOL_TOKEN, useValue: mockPool },
        { provide: NotifyUserUseCase, useValue: mockNotifyUserUseCase },
      ],
    }).compile();

    useCase = module.get<VerifyModelUseCase>(VerifyModelUseCase);
  });

  it('debe aprobar una modelo exitosamente', async () => {
    const adminId = 'admin-id';
    const data = {
      verificationId: 'verif-id',
      decision: VerificationDecision.APPROVE,
    };

    mockClient.query.mockResolvedValue({
      rows: [{ user_id: 'user-id', status: 'PENDING' }],
    });

    const result = await useCase.execute(adminId, data);

    expect(result.success).toBe(true);
    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE model_verifications'),
      expect.any(Array),
    );
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE "user"'),
      expect.any(Array),
    );
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    expect(mockNotifyUserUseCase.execute).toHaveBeenCalled();
  });

  it('debe lanzar NotFoundException si la verificación no existe', async () => {
    mockClient.query.mockResolvedValue({ rows: [] });

    await expect(
      useCase.execute('admin-id', {
        verificationId: 'invalid',
      } as VerifyModelRequest),
    ).rejects.toThrow(NotFoundException);
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
  });

  it('debe lanzar BadRequestException si ya fue procesada', async () => {
    mockClient.query.mockResolvedValue({
      rows: [{ user_id: 'user-id', status: 'APPROVED' }],
    });

    await expect(
      useCase.execute('admin-id', {
        verificationId: 'id',
      } as VerifyModelRequest),
    ).rejects.toThrow(BadRequestException);
  });
});
