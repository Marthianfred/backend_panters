import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ChangeRoleHandler } from './change-role.handler';
import { PostgresUsersManagementRepository } from '../infrastructure/postgres.users-management.repository';
import { ChangeRoleRequest } from './change-role.models';

describe('ChangeRoleHandler', () => {
  let handler: ChangeRoleHandler;
  let repository: PostgresUsersManagementRepository;

  const mockRepository = {
    exists: jest.fn(),
    existsRole: jest.fn(),
    updateUserRole: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangeRoleHandler,
        {
          provide: PostgresUsersManagementRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<ChangeRoleHandler>(ChangeRoleHandler);
    repository = module.get<PostgresUsersManagementRepository>(
      PostgresUsersManagementRepository,
    );
  });

  const userId = 'user-123';
  const roleId = 'role-uuid-456';
  const request: ChangeRoleRequest = { roleId };

  it('debe estar definido', () => {
    expect(handler).toBeDefined();
  });

  it('debe cambiar el rol exitosamente si el usuario y el rol existen', async () => {
    mockRepository.exists.mockResolvedValue(true);
    mockRepository.existsRole.mockResolvedValue(true);
    mockRepository.updateUserRole.mockResolvedValue(undefined);

    const result = await handler.handle(userId, request);

    expect(repository.exists).toHaveBeenCalledWith(userId);
    expect(repository.existsRole).toHaveBeenCalledWith(roleId);
    expect(repository.updateUserRole).toHaveBeenCalledWith(userId, roleId);
    expect(result).toEqual({ success: true, roleId });
  });

  it('debe lanzar NotFoundException si el usuario no existe', async () => {
    mockRepository.exists.mockResolvedValue(false);

    await expect(handler.handle(userId, request)).rejects.toThrow(
      new NotFoundException(`Usuario con ID ${userId} no encontrado.`),
    );
  });

  it('debe lanzar NotFoundException si el rol no existe en base de datos', async () => {
    mockRepository.exists.mockResolvedValue(true);
    mockRepository.existsRole.mockResolvedValue(false);

    await expect(handler.handle(userId, request)).rejects.toThrow(
      new NotFoundException(`El rol con ID ${roleId} no existe en el sistema.`),
    );
  });
});
