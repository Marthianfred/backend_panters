import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import {
  BETTER_AUTH_TOKEN,
  AUTH_POOL_TOKEN,
} from '@/features/auth/infrastructure/auth.constants';
import { RegisterModelRequest } from './register-model.dto';
import { RegisterClientResponse } from '@/features/auth/domain/register-client.models';
import { NotifyAdminsUseCase } from '@/features/notifications/application/use-cases/notify-admins.use-case';
import { type BetterAuthInstance } from '@/features/auth/types/auth.types';

@Injectable()
export class RegisterModelUseCase {
  constructor(
    @Inject(BETTER_AUTH_TOKEN)
    private readonly authInstance: BetterAuthInstance,
    @Inject(AUTH_POOL_TOKEN)
    private readonly pool: Pool,
    private readonly notifyAdminsUseCase: NotifyAdminsUseCase,
  ) {}

  async execute(data: RegisterModelRequest): Promise<RegisterClientResponse> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Registro inicial mediante Better Auth
      const result = await this.authInstance.api.signUpEmail({
        body: {
          email: data.email,
          password: data.password,
          name: data.name,
          username: data.username,
          birthDate: data.birthDate,
          gender: data.gender,
          age: data.age,
        },
      });

      if (!result || !result.user) {
        throw new BadRequestException('No se pudo crear el usuario modelo.');
      }

      const userId = result.user.id;

      // 2. Actualizar rol y desactivar cuenta (is_active = false)
      const MODEL_ROLE_ID = 'f88b9012-bd7c-47ea-a2a9-c70a84d2f831';
      const MODEL_ROLE_NAME = 'model';

      await client.query(
        `UPDATE "user" 
         SET "roleId" = $1, "role" = $2, "is_active" = false 
         WHERE id = $3`,
        [MODEL_ROLE_ID, MODEL_ROLE_NAME, userId],
      );

      // 3. Crear registro en model_verifications
      await client.query(
        `INSERT INTO model_verifications (user_id, status) 
         VALUES ($1, 'PENDING')`,
        [userId],
      );

      await client.query('COMMIT');

      // 4. Notificar a los administradores
      this.notifyAdminsUseCase
        .execute({
          title: 'Nueva Modelo Registrada 🌟',
          body: `La modelo ${data.username} se ha registrado y espera verificación.`,
          data: {
            userId,
            type: 'MODEL_REGISTRATION_PENDING',
          },
        })
        .catch((err: unknown) => console.error('[NOTIFY_ADMINS_ERROR]', err));

      return {
        success: true,
        message:
          'Registro exitoso. Tu perfil está pendiente de verificación por un administrador.',
        user: {
          id: userId,
          email: result.user.email,
          name: result.user.name,
        },
      };
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      console.error('[REGISTER_MODEL_ERROR]', error);

      interface ErrorResponse {
        response?: {
          message?: string;
        };
        message?: string;
      }
      const err = error as ErrorResponse;
      const message =
        err.response?.message ||
        err.message ||
        'Error en el registro de modelo';
      throw new BadRequestException(message);
    } finally {
      client.release();
    }
  }
}
