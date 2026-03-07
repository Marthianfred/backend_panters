import { Injectable, Inject } from '@nestjs/common';
import { Request, Response } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { BETTER_AUTH_TOKEN } from '../infrastructure/better-auth.provider';

interface BetterAuthInstance {
  handler: (request: Request) => Promise<Response>;
}

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
    // Cast temporal a unknown para satisfacer la firma de toNodeHandler que requiere un tipo específico de Better Auth
    const handler = toNodeHandler(
      this.authInstance as unknown as Parameters<typeof toNodeHandler>[0],
    );
    return handler(req, res);
  }
}
