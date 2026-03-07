import { Provider } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

export const BETTER_AUTH_TOKEN = Symbol('BETTER_AUTH_TOKEN');

export const BetterAuthProvider: Provider = {
  provide: BETTER_AUTH_TOKEN,
  useFactory: (configService: ConfigService) => {
    const databaseUrl = configService.getOrThrow<string>('DATABASE_URL');
    const baseUrl = configService.getOrThrow<string>('BASE_URL');
    const secret = configService.getOrThrow<string>('BETTER_AUTH_SECRET');

    const pool = new Pool({
      connectionString: databaseUrl,
    });

    return betterAuth({
      database: pool,
      emailAndPassword: {
        enabled: true,
      },
      baseURL: baseUrl,
      secret: secret,
    });
  },
  inject: [ConfigService],
};
