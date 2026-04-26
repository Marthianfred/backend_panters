import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetSubscriptionStatusUseCase } from '../application/get-subscription-status.use-case';
import { SubscriptionStatusQueryDto, SubscriptionStatusResponseDto } from '../domain/subscription-status.dto';

@ApiTags('Subscriptions')
@Controller('api/v1/subscriptions')
export class GetSubscriptionStatusController {
  constructor(private readonly getSubscriptionStatusUseCase: GetSubscriptionStatusUseCase) {}

  @Get('status')
  @ApiOperation({ summary: 'Obtener el estatus actual de una suscripción' })
  @ApiResponse({
    status: 200,
    description: 'Estatus de la suscripción obtenido con éxito',
    type: SubscriptionStatusResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Suscripción no encontrada' })
  async getStatus(@Query() query: SubscriptionStatusQueryDto): Promise<SubscriptionStatusResponseDto> {
    return this.getSubscriptionStatusUseCase.execute(query.subscriptionId);
  }
}
