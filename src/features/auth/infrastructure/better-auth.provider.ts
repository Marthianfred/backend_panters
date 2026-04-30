import { Provider } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { createAuthMiddleware } from 'better-auth/api';
import { username, captcha } from 'better-auth/plugins';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

import { BETTER_AUTH_TOKEN } from './auth.constants';
import { EMAIL_SERVICE_TOKEN, EmailService } from '@/core/domain/services/email-service.interface';
import { NotifyUserUseCase } from '../../notifications/application/use-cases/notify-user.use-case';

export const AUTH_POOL_TOKEN = 'AUTH_POOL_TOKEN';

export const AuthPoolProvider: Provider = {
  provide: AUTH_POOL_TOKEN,
  useFactory: (configService: ConfigService) => {
    return new Pool({
      connectionString: configService.getOrThrow<string>('DATABASE_URL'),
    });
  },
  inject: [ConfigService],
};

export const BetterAuthProvider: Provider = {
  provide: BETTER_AUTH_TOKEN,
  useFactory: (configService: ConfigService, emailService: EmailService, notifyUserUseCase: NotifyUserUseCase, pool: Pool) => {
    const baseUrl = configService.getOrThrow<string>('BASE_URL');
    const secret = configService.getOrThrow<string>('BETTER_AUTH_SECRET');
    const turnstileSecretKey = configService.getOrThrow<string>('TURNSTILE_SECRET_KEY');

    return betterAuth({
      database: pool,
      hooks: {
        after: createAuthMiddleware(async (ctx) => {
          if (ctx.path === '/sign-in/email' && ctx.method === 'POST') {
            const returned = ctx.context.returned;
            const user = ctx.context.newSession?.user || (returned as any)?.user;

            if (user && user.role === 'subscriber') {
              try {
                const query = `
                  SELECT status, ends_at as "endsAt"
                  FROM user_subscriptions
                  WHERE user_id = $1
                  ORDER BY created_at DESC
                  LIMIT 1;
                `;
                const result = await pool.query(query, [user.id]);
                const sub = result.rows[0];
                
                let subscription: any = null;
                if (sub) {
                  const now = new Date();
                  const isExpired = sub.status === 'expired' || (sub.endsAt && new Date(sub.endsAt) < now);
                  subscription = {
                    status: isExpired ? 'expired' : sub.status,
                    expiresAt: sub.endsAt,
                    isExpired
                  };
                } else {
                  subscription = { status: 'none', isExpired: false };
                }

                return ctx.json({
                  ...(typeof returned === 'object' ? returned : {}),
                  subscription
                });
              } catch (error) {
                console.error('Error fetching subscription in login hook:', error);
              }
            }
          }

        }),
      },
      user: {


        additionalFields: {
          roleId: {
            type: 'string', 
            required: false,
            defaultValue: 'd80b1a31-4521-4ec0-9329-30d4d1adc025',
          },
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
        async sendResetPassword({ user, url }) {
          await emailService.send({
            to: user.email,
            subject: 'Recuperación de contraseña - Panters',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
                <h1 style="color: #333;">Recuperación de contraseña</h1>
                <p>Hola ${user.name},</p>
                <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:</p>
                <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Restablecer contraseña</a>
                <p style="margin-top: 20px; font-size: 0.9em; color: #666;">Si no solicitaste esto, puedes ignorar este correo tranquilamente.</p>
                <p style="font-size: 0.8em; color: #999;">Este enlace expirará en 1 hora.</p>
              </div>
            `,
          });
        },
      },
      plugins: [
        username() as any,
        captcha({
          provider: 'cloudflare-turnstile',
          secretKey: turnstileSecretKey,
        }) as any,
      ],

      emailVerification: {
        async sendVerificationEmail({ user, url }) {
          await emailService.send({
            to: user.email,
            subject: 'Verifica tu cuenta - Panters',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
                <h1 style="color: #333;">Bienvenido a Panters</h1>
                <p>Hola ${user.name},</p>
                <p>Gracias por registrarte. Por favor, verifica tu cuenta haciendo clic en el siguiente enlace:</p>
                <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Verificar cuenta</a>
                <p style="margin-top: 20px; font-size: 0.9em; color: #666;">Si no creaste una cuenta, puedes ignorar este correo.</p>
              </div>
            `,
          });

          
          await notifyUserUseCase.execute(user.id, {
            title: 'Verifica tu cuenta 📧',
            body: 'Te hemos enviado un correo de verificación. Por favor, revísalo para activar todas las funciones.',
            icon: '/icons/notification-icon.png',
            data: { url },
          }).catch(err => console.error('Error enviando push de verificación:', err));
        },
        sendOnSignUp: true,
      },
      databaseHooks: {
        user: {
          create: {
            after: async (user) => {
              
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
  inject: [ConfigService, EMAIL_SERVICE_TOKEN, NotifyUserUseCase, AUTH_POOL_TOKEN],
};

