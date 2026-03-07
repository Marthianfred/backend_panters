import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthenticatedUser, AuthenticatedRequest } from '../types/auth.types';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  beforeEach(() => {
    guard = new AuthGuard();
  });

  it('debería permitir el acceso si el usuario está en el request', () => {
    const mockUser: AuthenticatedUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockRequest = {
      user: mockUser,
    } as unknown as AuthenticatedRequest;

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    const result = guard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  it('debería lanzar UnauthorizedException si no hay usuario en el request', () => {
    const mockRequest = {
      user: null,
    } as unknown as AuthenticatedRequest;

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
  });
});
