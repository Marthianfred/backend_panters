import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard, BetterAuthInstance } from './auth.guard';
import {
  AuthenticatedUser,
  Session,
  AuthenticatedRequest,
} from '../types/auth.types';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockAuthInstance: BetterAuthInstance;

  beforeEach(() => {
    mockAuthInstance = {
      api: {
        getSession: jest.fn(),
      },
    } as unknown as BetterAuthInstance;
    guard = new AuthGuard(mockAuthInstance);
  });

  it('debería permitir el acceso si la sesión es válida', async () => {
    const mockUser: AuthenticatedUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const mockSession: Session = {
      id: 'session-123',
      userId: 'user-123',
      token: 'valid-token',
      expiresAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (mockAuthInstance.api.getSession as jest.Mock).mockResolvedValue({
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
    expect((mockRequest as unknown as AuthenticatedRequest).user).toEqual(
      mockUser,
    );
  });

  it('debería lanzar UnauthorizedException si no hay sesión', async () => {
    (mockAuthInstance.api.getSession as jest.Mock).mockResolvedValue(null);

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
    (mockAuthInstance.api.getSession as jest.Mock).mockResolvedValue({
      user: null,
    });

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
