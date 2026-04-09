import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { RegisterClientService } from './register-client.service';
import { RegisterClientRequest, RegisterClientResponse, VerifyEmailRequest } from './register-client.models';

@Controller('api/v1/auth')
export class RegisterClientController {
  constructor(private readonly registerClientService: RegisterClientService) {}

  /**
   * Endpoint para el registro de nuevos clientes.
   * Lógica VSA: Este controlador es el punto de entrada para el slice vertical de registro.
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() body: RegisterClientRequest): Promise<RegisterClientResponse> {
    return this.registerClientService.register(body);
  }

  /**
   * Endpoint para la verificación del correo electrónico mediante el token recibido.
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verify(@Body() body: VerifyEmailRequest): Promise<{ success: boolean; message: string }> {
    return this.registerClientService.verify(body);
  }
}
