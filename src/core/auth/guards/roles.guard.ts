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
      return true; 
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user; 

    if (!user) {
      return false; 
    }

    
    const userRole = (user.role as Role) || Role.SUBSCRIBER;

    console.log(`[RolesGuard] Debug: userRole=${userRole}, requiredRoles=${requiredRoles}`);

    
    if (userRole === Role.ADMIN) {
      console.log('[RolesGuard] Access granted to ADMIN');
      return true;
    }

    const hasRole = requiredRoles.includes(userRole);
    if (!hasRole) {
      console.warn(`[RolesGuard] Access denied for user ${user.id} with role ${userRole}. Required: ${requiredRoles}`);
    }

    return hasRole;
  }
}
