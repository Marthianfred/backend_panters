import { Test, TestingModule } from '@nestjs/testing';
import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { SubscriptionGuard } from './subscription.guard';
import {
  IUserSubscriptionsRepository,
  USER_SUBSCRIPTIONS_REPOSITORY,
} from '@/features/subscriptions/interfaces/user.subscriptions.repository.interface';
import { AuthenticatedUser } from '@/features/auth/types/auth.types';

describe('SubscriptionGuard', () => {
  let guard: SubscriptionGuard;
  let userSubscriptionsRepository: jest.Mocked<IUserSubscriptionsRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionGuard,
        {
          provide: USER_SUBSCRIPTIONS_REPOSITORY,
          useValue: { findActiveByUserId: jest.fn() },
        },
      ],
    }).compile();

    guard = module.get<SubscriptionGuard>(SubscriptionGuard);
    userSubscriptionsRepository = module.get(USER_SUBSCRIPTIONS_REPOSITORY);
  });

  const createMockContext = (
    user: AuthenticatedUser | null,
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  };

  it('debe lanzar UnauthorizedException si no hay usuario en la request', async () => {
    const context = createMockContext(null);
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('debe permitir acceso si el usuario es admin', async () => {
    const context = createMockContext({
      id: 'admin-1',
      role: 'admin',
    } as AuthenticatedUser);
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
  });

  it('debe lanzar ForbiddenException si el usuario no tiene suscripción activa', async () => {
    const context = createMockContext({
      id: 'user-1',
      role: 'subscriber',
    } as AuthenticatedUser);
    (
      userSubscriptionsRepository.findActiveByUserId as jest.Mock
    ).mockResolvedValue(null);

    await expect(guard.canActivate(context)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('debe permitir acceso si el usuario tiene una suscripción activa', async () => {
    const context = createMockContext({
      id: 'user-1',
      role: 'subscriber',
    } as AuthenticatedUser);
    (
      userSubscriptionsRepository.findActiveByUserId as jest.Mock
    ).mockResolvedValue({
      id: 'sub-1',
      isActive: true,
    });

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(userSubscriptionsRepository.findActiveByUserId).toHaveBeenCalledWith(
      'user-1',
    );
  });
});
