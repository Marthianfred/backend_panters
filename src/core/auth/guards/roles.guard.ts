import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../roles.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // Si no hay decorador, el endpoint es público
    }

    const request = context.switchToHttp().getRequest();
    // Por motivos de la demostración sin Auth/DB final:
    const user = request.user || {
      id: 'anonymous',
      role: request.headers['x-mock-role'],
    };

    if (!user || !user.role) {
      return false; // Sin sesión iniciada o rol definido
    }

    return requiredRoles.some((role) => user.role === role);
  }
}
