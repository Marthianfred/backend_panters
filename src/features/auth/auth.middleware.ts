import { Injectable, NestMiddleware, Inject } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { BETTER_AUTH_TOKEN } from './infrastructure/auth.constants';
import type {
  AuthenticatedRequest,
  BetterAuthInstance,
} from './types/auth.types';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    @Inject(BETTER_AUTH_TOKEN)
    private readonly authInstance: BetterAuthInstance,
  ) {}

  public async use(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      // Forzamos el tipado para evitar errores de linter con tipos complejos de Better Auth
      const instance = this.authInstance;
      const sessionResponse = await instance.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });

      if (sessionResponse && sessionResponse.user) {
        // Autenticación exitosa: inyectamos el usuario y la sesión globalmente
        req.user = sessionResponse.user;
        req.session = sessionResponse.session;
      } else {
        // Autenticación opcional / No logueado
        // @ts-expect-error - Explicitly setting to null for optional auth
        req.user = null;
        // @ts-expect-error - Explicitly setting to null for optional auth
        req.session = null;
      }
    } catch {
      // Falla silenciosa para permitir endpoints públicos con tokens inválidos
      // @ts-expect-error - Fallback to null on error
      req.user = null;
      // @ts-expect-error - Fallback to null on error
      req.session = null;
    }

    next();
  }
}
