import { Controller, Post, Get, Body, UseGuards, Req, Logger } from '@nestjs/common';
import { PurchasePtcService } from '../application/purchase-ptc.service';
import { CreatePurchaseSessionDto } from '../dto/purchase-ptc.dto';
import { AuthGuard } from '@/features/auth/guards/auth.guard';

@Controller('api/v1/payments/purchase-ptc')
export class PurchasePtcController {
  private readonly logger = new Logger(PurchasePtcController.name);

  constructor(private readonly purchasePtcService: PurchasePtcService) {}

  /**
   * Endpoint para listar los paquetes de PTC disponibles configurados en la base de datos.
   */
  @Get('packages')
  async getPackages() {
    return await this.purchasePtcService.getAvailablePackages();
  }

  /**
   * Endpoint para iniciar el proceso de compra de PTC.
   * Retorna la URL de Stripe Checkout para que el cliente complete el pago.
   */
  @Post('session')
  @UseGuards(AuthGuard)
  async createPurchaseSession(
    @Body() dto: CreatePurchaseSessionDto,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    
    this.logger.log(`Solicitud de compra de PTC recibida para el usuario: ${userId}`);
    
    return await this.purchasePtcService.createSession(userId, dto.priceId);
  }
}
