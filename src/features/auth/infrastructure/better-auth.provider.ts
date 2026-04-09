import { Provider } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { username } from 'better-auth/plugins';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

import { BETTER_AUTH_TOKEN } from './auth.constants';

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
      user: {
        additionalFields: {
          role: {
            type: 'string',
            required: false,
            defaultValue: 'subscriber',
          },
          username: {
            type: 'string',
            required: true,
          },
          birthDate: {
            type: 'string',
            required: false,
          },
          gender: {
            type: 'string',
            required: false,
          },
          age: {
            type: 'number',
            required: false,
          },
        },
      },
      emailAndPassword: {
        enabled: true,
      },
      plugins: [username()],
      emailVerification: {
        async sendVerificationEmail({ user, url }) {
          // TODO: Integrar con servicio de correo real (Resend/SendGrid)
          console.log(`[EMAIL VERIFICATION] Para: ${user.email}`);
          console.log(`[EMAIL VERIFICATION] URL: ${url}`);
        },
        sendOnSignUp: true,
      },
      databaseHooks: {
        user: {
          create: {
            after: async (user) => {
              // Inicializar perfil y wallet mediante SQL directo para asegurar atomicidad o consistencia inicial
              try {
                const userData = user as any;
                await pool.query(
                  'INSERT INTO antigravity_profiles (user_id, full_name, username, birth_date, gender, age, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                  [
                    userData.id,
                    userData.name,
                    userData.username,
                    userData.birthDate || null,
                    userData.gender || null,
                    userData.age || null,
                    true,
                  ],
                );
                await pool.query(
                  'INSERT INTO antigravity_wallets (user_id, panter_coin_balance) VALUES ($1, $2)',
                  [userData.id, 0],
                );
              } catch (error) {
                console.error('Error initializing user profile/wallet:', error);
              }
            },
          },
        },
      },
      baseURL: baseUrl,
      secret: secret,
      trustedOrigins: ['http://*', 'https://*', '*'],
    });
  },
  inject: [ConfigService],
};
