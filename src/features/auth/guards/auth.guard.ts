import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { BETTER_AUTH_TOKEN } from '../infrastructure/better-auth.provider';
import { fromNodeHeaders } from 'better-auth/node';
import type { AuthenticatedUser, Session } from '../types/auth.types';

export interface BetterAuthInstance {
  api: {
    getSession: (options: { headers: Headers }) => Promise<{
      user: AuthenticatedUser;
      session: Session;
    } | null>;
  };
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(BETTER_AUTH_TOKEN)
    private readonly authInstance: BetterAuthInstance,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
      session?: Session;
      headers: Record<string, string>;
    }>();

    // Validamos la sesión usando los encabezados de la petición
    const sessionResponse = await this.authInstance.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!sessionResponse || !sessionResponse.user) {
      throw new UnauthorizedException(
        'Sesión inválida, inexistente o expirada.',
      );
    }

    // Adjuntamos la sesión y el usuario al request para uso posterior
    request.user = sessionResponse.user;
    request.session = sessionResponse.session;

    return true;
  }
}
