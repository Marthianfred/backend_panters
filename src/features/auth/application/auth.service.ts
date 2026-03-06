import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { Request, Response } from 'express';

@Injectable()
export class AuthService implements OnModuleInit {
  private authInstance: any;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const databaseUrl = this.configService.getOrThrow<string>('DATABASE_URL');

    this.authInstance = betterAuth({
      database: new Pool({
        connectionString: databaseUrl,
      }),
      emailAndPassword: {
        enabled: true,
      },
      // You can expand Better Auth plugins according to VSA principles when needed.
    });
  }

  get instance() {
    return this.authInstance;
  }

  async handleAuthRequest(req: Request, res: Response) {
    if (!this.authInstance) {
      throw new Error('BetterAuth is not initialized.');
    }
    return this.authInstance.handler(req, res);
  }
}
