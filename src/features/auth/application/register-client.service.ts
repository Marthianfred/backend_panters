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

      const errorCode = error.body?.code || error.code;

      if (errorCode === 'USER_ALREADY_EXISTS') {
        throw new BadRequestException('El correo electrónico ya está registrado.');
      }

      if (errorCode === 'USERNAME_IS_ALREADY_TAKEN') {
        throw new BadRequestException('El nombre de usuario ya está en uso. Por favor, elige otro.');
      }

      if (error.status === 400) {
        throw new BadRequestException(error.body?.message || 'Los datos de registro son inválidos.');
      }

      throw new InternalServerErrorException('Error interno al procesar el registro.');
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
