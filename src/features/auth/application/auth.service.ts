import { Injectable, Inject } from '@nestjs/common';
import { Request, Response } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { BETTER_AUTH_TOKEN } from '../infrastructure/better-auth.provider';

@Injectable()
export class AuthService {
  constructor(@Inject(BETTER_AUTH_TOKEN) private readonly authInstance: any) {}

  public get instance() {
    return this.authInstance;
  }

  public async handleAuthRequest(req: Request, res: Response): Promise<void> {
    const handler = toNodeHandler(this.authInstance);
    return handler(req, res);
  }
}
