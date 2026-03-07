import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { BETTER_AUTH_TOKEN } from '../infrastructure/better-auth.provider';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockAuthInstance: any;

  beforeEach(() => {
    mockAuthInstance = {
      api: {
        getSession: jest.fn(),
      },
    };
    guard = new AuthGuard(mockAuthInstance);
  });

  it('debería permitir el acceso si la sesión es válida', async () => {
    const mockUser = { id: 'user-123', name: 'Test User' };
    const mockSession = { token: 'valid-token' };

    mockAuthInstance.api.getSession.mockResolvedValue({
      user: mockUser,
      session: mockSession,
    });

    const mockRequest = {
      headers: { authorization: 'Bearer valid-token' },
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(true);
    expect(mockRequest['user']).toEqual(mockUser);
    expect(mockRequest['session']).toEqual(mockSession);
  });

  it('debería lanzar UnauthorizedException si no hay sesión', async () => {
    mockAuthInstance.api.getSession.mockResolvedValue(null);

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('debería lanzar UnauthorizedException si no hay usuario en la sesión', async () => {
    mockAuthInstance.api.getSession.mockResolvedValue({ user: null });

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
