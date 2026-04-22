import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Inject,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import * as userSubscriptionsRepositoryInterface from '@/features/subscriptions/interfaces/user.subscriptions.repository.interface';
import { AuthenticatedRequest } from '@/features/auth/types/auth.types';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    @Inject(userSubscriptionsRepositoryInterface.USER_SUBSCRIPTIONS_REPOSITORY)
    private readonly userSubscriptionsRepository: userSubscriptionsRepositoryInterface.IUserSubscriptionsRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // 1. Verificar autenticación (El AuthGuard debería correr antes, pero validamos por seguridad)
    if (!request.user) {
      throw new UnauthorizedException('Se requiere autenticación para acceder a este recurso.');
    }

    // 2. Los Admins suelen saltarse las restricciones de suscripción
    if (request.user.role === 'admin') {
      return true;
    }

    // 3. Buscar suscripción activa para el usuario
    const activeSubscription = await this.userSubscriptionsRepository.findActiveByUserId(request.user.id);

    if (!activeSubscription) {
      throw new ForbiddenException(
        'Acceso denegado: Se requiere una suscripción activa para acceder a este contenido premium.'
      );
    }

    return true;
  }
}
