import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PurchasePtcService } from '../application/purchase-ptc.service';
import { CreatePurchaseSessionDto } from '../dto/purchase-ptc.dto';
import { AuthGuard } from '@/features/auth/guards/auth.guard';
import type { AuthenticatedRequest } from '@/features/auth/types/auth.types';

@Controller('api/v1/payments/purchase-ptc')
export class PurchasePtcController {
  private readonly logger = new Logger(PurchasePtcController.name);

  constructor(private readonly purchasePtcService: PurchasePtcService) {}

  @Get('packages')
  async getPackages() {
    return await this.purchasePtcService.getAvailablePackages();
  }

  @Post('session')
  @UseGuards(AuthGuard)
  async createPurchaseSession(
    @Body() dto: CreatePurchaseSessionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!req.user) {
      throw new BadRequestException('Usuario no autenticado');
    }
    const userId = req.user.id;

    this.logger.log(
      `Solicitud de compra de PTC recibida para el usuario: ${userId}`,
    );

    return await this.purchasePtcService.createSession(userId, dto.priceId);
  }
}
