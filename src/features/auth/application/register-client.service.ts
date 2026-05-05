import { Injectable, Inject, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { BETTER_AUTH_TOKEN } from '../infrastructure/auth.constants';
import type { BetterAuthInstance } from '../types/auth.types';
import { RegisterClientRequest, RegisterClientResponse, VerifyEmailRequest } from '../domain/register-client.models';

@Injectable()
export class RegisterClientService {
  constructor(
    @Inject(BETTER_AUTH_TOKEN)
    private readonly authInstance: any, 
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
    } catch (error: any) {
      console.error('[AUTH_REGISTER_ERROR]', error);

      // Si ya es una excepción de NestJS, relanzarla
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }

      // Intentar obtener el cuerpo del error (puede venir como string o objeto)
      let errorBody = error.body;
      if (typeof errorBody === 'string') {
        try {
          errorBody = JSON.parse(errorBody);
        } catch (e) {
          // No es JSON, ignorar
        }
      }

      // Extraer el código de error de varias posibles estructuras
      const errorCode = (errorBody && typeof errorBody === 'object' ? errorBody.code : null) || 
                        error.code || 
                        (typeof error.message === 'string' ? error.message : '');

      // Mapeo de errores de duplicación (Email/Usuario)
      if (errorCode.toString().includes('USER_ALREADY_EXISTS') || 
          errorCode.toString().includes('EMAIL_ALREADY_EXISTS')) {
        throw new BadRequestException('El correo electrónico ya está registrado.');
      }

      if (errorCode.toString().includes('USERNAME_IS_ALREADY_TAKEN')) {
        throw new BadRequestException('El nombre de usuario ya está en uso. Por favor, elige otro.');
      }

      // Si es un error 400 (Bad Request) de Better Auth, relanzarlo como BadRequestException de NestJS
      if (error.status === 400 || error.statusCode === 400) {
        const message = (errorBody && typeof errorBody === 'object' ? errorBody.message : null) || 
                        error.message || 
                        'Los datos de registro son inválidos.';
        throw new BadRequestException(message);
      }

      // Si no se pudo identificar el error, lanzar 500 con el mensaje original para debugging (temporal)
      throw new InternalServerErrorException(
        `Error interno al procesar el registro. Detalle: ${error.message || 'Error desconocido'}`
      );
    }
  }

  
  async verify(data: VerifyEmailRequest): Promise<{ success: boolean; message: string }> {
    try {
      
      
      
      
      
      const result = await this.authInstance.api.verifyEmail({
        query: {
          token: data.token,
        },
      });

      if (!result) {
        throw new BadRequestException('Token de verificación inválido o expirado.');
      }

      return {
        success: true,
        message: 'Correo electrónico verificado con éxito.',
      };
    } catch (error: any) {
      const errorCode = error.body?.code || error.code;
      if (errorCode === 'INVALID_TOKEN' || errorCode === 'EXPIRED_TOKEN') {
        throw new BadRequestException('El enlace de verificación es inválido o ha expirado.');
      }
      throw new BadRequestException('Error al verificar el correo electrónico.');
    }
  }
}
