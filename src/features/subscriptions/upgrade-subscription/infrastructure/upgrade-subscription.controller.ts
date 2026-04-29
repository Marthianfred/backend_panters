import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UpgradeSubscriptionUseCase } from '../application/upgrade-subscription.use-case';
import { UpgradeSubscriptionDto, UpgradeSessionResponse } from '../domain/upgrade-subscription.dto';
import { AuthGuard } from '@/features/auth/guards/auth.guard';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('api/v1/subscriptions')
export class UpgradeSubscriptionController {
  constructor(private readonly upgradeSubscriptionUseCase: UpgradeSubscriptionUseCase) {}

  @Post('me/upgrade')
  @ApiOperation({ summary: 'Inicia el proceso de mejora (upgrade) a un plan superior' })
  @ApiResponse({ status: 201, description: 'Sesión de Stripe para el upgrade generada', type: UpgradeSessionResponse })
  @ApiResponse({ status: 400, description: 'El plan seleccionado no es superior o no es válido' })
  async upgrade(
    @Request() req: any,
    @Body() dto: UpgradeSubscriptionDto,
  ): Promise<UpgradeSessionResponse> {
    const userId = req.user.id;
    return this.upgradeSubscriptionUseCase.execute(userId, dto);
  }
}
