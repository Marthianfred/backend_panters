import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { BETTER_AUTH_TOKEN } from '../infrastructure/better-auth.provider';
import { fromNodeHeaders } from 'better-auth/node';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(BETTER_AUTH_TOKEN) private readonly authInstance: any) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Validamos la sesión usando los encabezados de la petición
    const session = await this.authInstance.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session || !session.user) {
      throw new UnauthorizedException(
        'Sesión inválida, inexistente o expirada.',
      );
    }

    // Adjuntamos la sesión y el usuario al request para uso posterior
    request.user = session.user;
    request.session = session.session;

    return true;
  }
}
