import {
  Injectable,
  Inject,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { BETTER_AUTH_TOKEN } from '../infrastructure/auth.constants';
import type { BetterAuthInstance } from '../types/auth.types';
import {
  RegisterClientRequest,
  RegisterClientResponse,
  VerifyEmailRequest,
} from '../domain/register-client.models';

@Injectable()
export class RegisterClientService {
  constructor(
    @Inject(BETTER_AUTH_TOKEN)
    private readonly authInstance: BetterAuthInstance,
  ) {}

  async register(data: RegisterClientRequest): Promise<RegisterClientResponse> {
    try {
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

      if (!result) {
        throw new BadRequestException('El registro no pudo completarse.');
      }

      return {
        success: true,
        message: 'Registro exitoso. Por favor, verifica tu correo electrónico.',
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        },
      };
    } catch (error: unknown) {
      console.error('[AUTH_REGISTER_ERROR]', error);

      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      interface BetterAuthError {
        body?: string | { code?: string; message?: string };
        code?: string;
        message?: string;
        status?: number;
        statusCode?: number;
      }

      const err = error as BetterAuthError;
      let errorBody: { code?: string; message?: string } | null = null;

      if (err.body) {
        if (typeof err.body === 'string') {
          try {
            errorBody = JSON.parse(err.body) as {
              code?: string;
              message?: string;
            };
          } catch {
            // Error parsing body
          }
        } else {
          errorBody = err.body;
        }
      }

      const errorCode = errorBody?.code || err.code || err.message || '';
      const errorCodeStr = String(errorCode);

      if (
        errorCodeStr.includes('USER_ALREADY_EXISTS') ||
        errorCodeStr.includes('EMAIL_ALREADY_EXISTS')
      ) {
        throw new BadRequestException(
          'El correo electrónico ya está registrado.',
        );
      }

      if (errorCodeStr.includes('USERNAME_IS_ALREADY_TAKEN')) {
        throw new BadRequestException(
          'El nombre de usuario ya está en uso. Por favor, elige otro.',
        );
      }

      if (err.status === 400 || err.statusCode === 400) {
        const message =
          errorBody?.message ||
          err.message ||
          'Los datos de registro son inválidos.';
        throw new BadRequestException(message);
      }

      throw new InternalServerErrorException(
        `Error interno al procesar el registro. Detalle: ${err.message || 'Error desconocido'}`,
      );
    }
  }

  async verify(
    data: VerifyEmailRequest,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.authInstance.api.verifyEmail({
        query: {
          token: data.token,
        },
      });

      if (!result) {
        throw new BadRequestException(
          'Token de verificación inválido o expirado.',
        );
      }

      return {
        success: true,
        message: 'Correo electrónico verificado con éxito.',
      };
    } catch (error: unknown) {
      interface BetterAuthError {
        body?: { code?: string };
        code?: string;
      }
      const err = error as BetterAuthError;
      const errorCode = err.body?.code || err.code;
      if (errorCode === 'INVALID_TOKEN' || errorCode === 'EXPIRED_TOKEN') {
        throw new BadRequestException(
          'El enlace de verificación es inválido o ha expirado.',
        );
      }
      throw new BadRequestException(
        'Error al verificar el correo electrónico.',
      );
    }
  }
}
