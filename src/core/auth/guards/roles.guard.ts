import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../roles.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedRequest } from '../../../features/auth/types/auth.types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // Si no hay decorador, el endpoint es público o gestionado por AuthGuard
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user; // Cargado previamente por AuthGuard

    if (!user) {
      return false; // Sin sesión (el AuthGuard ya debería haber fallado antes si se aplica)
    }

    // Nota: El rol en BetterAuth se guarda típicamente en el objeto del usuario
    const userRole = (user.role as Role) || Role.SUBSCRIBER;

    return requiredRoles.includes(userRole);
  }
}
