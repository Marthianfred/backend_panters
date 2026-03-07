import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../types/auth.types';

@Injectable()
export class AuthGuard implements CanActivate {
  public canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    // El AuthMiddleware ya pobló esta propiedad previamente (o es null)
    if (!request.user) {
      throw new UnauthorizedException(
        'Acceso denegado: Se requiere autenticación válida.',
      );
    }

    return true;
  }
}
