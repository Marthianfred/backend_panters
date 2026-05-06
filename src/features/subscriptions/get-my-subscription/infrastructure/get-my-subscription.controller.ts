import {
  Controller,
  Get,
  Request,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetMySubscriptionUseCase } from '../application/get-my-subscription.use-case';
import { MySubscriptionResponseDto } from '../domain/my-subscription.dto';
import { AuthGuard } from '@/features/auth/guards/auth.guard';
import type { AuthenticatedRequest } from '@/features/auth/types/auth.types';

@ApiTags('Subscriptions')
@ApiBearerAuth()
@Controller('api/v1/subscriptions')
export class GetMySubscriptionController {
  constructor(
    private readonly getMySubscriptionUseCase: GetMySubscriptionUseCase,
  ) {}

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Obtener la suscripción activa del usuario autenticado',
  })
  @ApiResponse({
    status: 200,
    description: 'Suscripción activa obtenida con éxito',
    type: MySubscriptionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No se encontró suscripción activa',
  })
  async getMySubscription(
    @Request() req: AuthenticatedRequest,
  ): Promise<MySubscriptionResponseDto | null> {
    if (!req.user) {
      throw new BadRequestException('Usuario no autenticado');
    }
    const userId = req.user.id;
    return this.getMySubscriptionUseCase.execute(userId);
  }
}
