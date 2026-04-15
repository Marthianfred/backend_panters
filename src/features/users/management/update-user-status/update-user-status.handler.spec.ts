import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UpdateUserStatusHandler } from './update-user-status.handler';
import { PostgresUsersManagementRepository } from '../infrastructure/postgres.users-management.repository';
import { UpdateUserStatusRequest } from './update-user-status.models';

describe('UpdateUserStatusHandler', () => {
  let handler: UpdateUserStatusHandler;
  let repository: jest.Mocked<PostgresUsersManagementRepository>;

  beforeEach(async () => {
    const repositoryMock = {
      exists: jest.fn(),
      updateUserStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateUserStatusHandler,
        {
          provide: PostgresUsersManagementRepository,
          useValue: repositoryMock,
        },
      ],
    }).compile();

    handler = module.get<UpdateUserStatusHandler>(UpdateUserStatusHandler);
    repository = module.get(PostgresUsersManagementRepository);
  });

  it('debe estar definido', () => {
    expect(handler).toBeDefined();
  });

  it('debe actualizar el estado del usuario exitosamente', async () => {
    const userId = 'user-123';
    const request: UpdateUserStatusRequest = { isActive: true };
    repository.exists.mockResolvedValue(true);
    repository.updateUserStatus.mockResolvedValue(undefined);

    const result = await handler.handle(userId, request);

    expect(repository.exists).toHaveBeenCalledWith(userId);
    expect(repository.updateUserStatus).toHaveBeenCalledWith(userId, true);
    expect(result).toEqual({ success: true, isActive: true });
  });

  it('debe lanzar NotFoundException si el usuario no existe', async () => {
    const userId = 'user-999';
    const request: UpdateUserStatusRequest = { isActive: false };
    repository.exists.mockResolvedValue(false);

    await expect(handler.handle(userId, request)).rejects.toThrow(
      new NotFoundException(`Usuario con ID ${userId} no encontrado.`),
    );

    expect(repository.exists).toHaveBeenCalledWith(userId);
    expect(repository.updateUserStatus).not.toHaveBeenCalled();
  });
});
