import { Injectable, Inject } from '@nestjs/common';
import { Request, Response } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { BETTER_AUTH_TOKEN } from '../infrastructure/auth.constants';
import type { BetterAuthInstance } from '../types/auth.types';

@Injectable()
export class AuthService {
  constructor(
    @Inject(BETTER_AUTH_TOKEN)
    private readonly authInstance: BetterAuthInstance,
  ) {}

  public get instance(): BetterAuthInstance {
    return this.authInstance;
  }

  public async handleAuthRequest(req: Request, res: Response): Promise<void> {
    
    const handler = toNodeHandler(
      this.authInstance as unknown as Parameters<typeof toNodeHandler>[0],
    );
    return handler(req, res);
  }
}
