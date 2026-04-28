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
      const instance = this.authInstance;
      const sessionResponse = await instance.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });

      if (sessionResponse && sessionResponse.user) {
        req.user = sessionResponse.user;
        req.session = sessionResponse.session;
      } else {
        req.user = null as any;
        req.session = null as any;
      }
    } catch {
      req.user = null as any;
      req.session = null as any;
    }

    next();
  }
}
