import { Body, Controller, Post, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PreRegistrationUseCase } from '../application/pre-registration.use-case';
import { PreRegistrationRequestDto, PreRegistrationResponseDto } from '../domain/pre-registration.dto';

@ApiTags('Subscriptions')
@Controller('api/v1/subscriptions')
export class PreRegistrationController {
  constructor(private readonly preRegistrationUseCase: PreRegistrationUseCase) {}

  @Post('pre-register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Pre-registro de cliente y selección de plan', 
    description: 'Crea un usuario en el sistema y una suscripción pendiente de pago para usuarios tipo Cliente.' 
  })
  @ApiResponse({ status: 201, type: PreRegistrationResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos o usuario ya existe' })
  @ApiResponse({ status: 404, description: 'Plan no encontrado' })
  async preRegister(@Body() dto: PreRegistrationRequestDto): Promise<PreRegistrationResponseDto> {
    return await this.preRegistrationUseCase.execute(dto);
  }
}
