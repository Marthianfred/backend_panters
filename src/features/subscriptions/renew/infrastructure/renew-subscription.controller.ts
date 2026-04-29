import { Controller, Post, UseGuards, Request } from '@nestjs/common';

import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RenewSubscriptionUseCase, RenewSessionResponse } from '../application/renew-subscription.use-case';
import { AuthGuard } from '@/features/auth/guards/auth.guard';

@ApiTags('subscriptions')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/v1/subscriptions')
export class RenewSubscriptionController {

  constructor(private readonly renewSubscriptionUseCase: RenewSubscriptionUseCase) {}

  @Post('me/renew')
  @ApiOperation({ summary: 'Genera una sesión de pago para renovar la suscripción activa del usuario' })
  @ApiResponse({ status: 201, description: 'Sesión de Stripe generada con éxito' })
  @ApiResponse({ status: 404, description: 'Suscripción activa no encontrada' })
  @ApiResponse({ status: 400, description: 'Error al generar la sesión de pago' })
  async renew(
    @Request() req: any,
  ): Promise<RenewSessionResponse> {
    const userId = req.user.id;
    return this.renewSubscriptionUseCase.execute({ userId });
  }
}

