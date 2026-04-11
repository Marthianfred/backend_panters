import { AdminCreateUserHandler } from './admin-create-user.handler';
import { UserRoleFlag } from './admin-create-user.models';
import { PostgresUsersManagementRepository } from '../infrastructure/postgres.users-management.repository';

describe('AdminCreateUserHandler', () => {
  let handler: AdminCreateUserHandler;
  let mockAuthInstance: any;
  let mockRepository: jest.Mocked<PostgresUsersManagementRepository>;

  beforeEach(() => {
    mockAuthInstance = {
      api: {
        signUpEmail: jest.fn(),
      },
    };
    mockRepository = {
      updateUserRole: jest.fn(),
      setMustChangePassword: jest.fn(),
    } as any;

    handler = new AdminCreateUserHandler(mockAuthInstance, mockRepository);
  });

  it('debe crear un usuario y marcar forzar cambio de contraseña', async () => {
    const request = {
      email: 'newuser@test.com',
      password: 'initialPassword123',
      name: 'New User',
      role: UserRoleFlag.MODEL,
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
    expect(mockRepository.updateUserRole).toHaveBeenCalledWith('user-123', 'model');
    expect(mockRepository.setMustChangePassword).toHaveBeenCalledWith('user-123', true);
    expect(result.mustChangePassword).toBe(true);
    expect(result.userId).toBe('user-123');
  });

  it('debe lanzar error si falla signUpEmail', async () => {
    mockAuthInstance.api.signUpEmail.mockRejectedValue(new Error('Auth failed'));
    
    await expect(handler.handle({
      email: 'error@test.com',
      password: 'password',
      name: 'Error',
      role: UserRoleFlag.SUBSCRIBER
    })).rejects.toThrow('Auth failed');
  });
});
