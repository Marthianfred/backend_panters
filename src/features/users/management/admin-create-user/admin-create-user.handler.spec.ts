import { AdminCreateUserHandler } from './admin-create-user.handler';
import { PostgresUsersManagementRepository } from '../infrastructure/postgres.users-management.repository';
import type { BetterAuthInstance } from '../../../auth/types/auth.types';

describe('AdminCreateUserHandler', () => {
  let handler: AdminCreateUserHandler;
  let mockAuthInstance: {
    api: {
      signUpEmail: jest.Mock;
    };
  };
  let mockRepository: jest.Mocked<PostgresUsersManagementRepository>;

  const mockRoleId = 'c901e6a7-f58c-493e-b567-5d554a32ac46';

  beforeEach(() => {
    mockAuthInstance = {
      api: {
        signUpEmail: jest.fn(),
      },
    };
    mockRepository = {
      updateUserRole: jest.fn(),
      setMustChangePassword: jest.fn(),
    } as unknown as jest.Mocked<PostgresUsersManagementRepository>;

    handler = new AdminCreateUserHandler(
      mockAuthInstance as unknown as BetterAuthInstance,
      mockRepository,
    );
  });

  it('debe crear un usuario y marcar forzar cambio de contraseña', async () => {
    const request = {
      email: 'newuser@test.com',
      password: 'initialPassword123',
      name: 'New User',
      roleId: mockRoleId,
    };

    mockAuthInstance.api.signUpEmail.mockResolvedValue({
      user: { id: 'user-123' },
    });

    const result = await handler.handle(request);

    expect(mockAuthInstance.api.signUpEmail).toHaveBeenCalledWith({
      body: {
        email: request.email,
        password: request.password,
        name: request.name,
      },
    });
    expect(mockRepository.updateUserRole).toHaveBeenCalledWith(
      'user-123',
      mockRoleId,
    );
    expect(mockRepository.setMustChangePassword).toHaveBeenCalledWith(
      'user-123',
      true,
    );
    expect(result.mustChangePassword).toBe(true);
    expect(result.userId).toBe('user-123');
    expect(result.roleId).toBe(mockRoleId);
  });

  it('debe lanzar error si falla signUpEmail', async () => {
    mockAuthInstance.api.signUpEmail.mockRejectedValue(
      new Error('Auth failed'),
    );

    await expect(
      handler.handle({
        email: 'error@test.com',
        password: 'password',
        name: 'Error',
        roleId: mockRoleId,
      }),
    ).rejects.toThrow('Auth failed');
  });
});
