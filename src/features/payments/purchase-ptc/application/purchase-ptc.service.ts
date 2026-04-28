import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { StripeService } from '@/core/infrastructure/stripe/stripe.service';
import { ConfigService } from '@nestjs/config';
import { PtcPackageRepository } from '../infrastructure/ptc-package.repository';

@Injectable()
export class PurchasePtcService {
  private readonly logger = new Logger(PurchasePtcService.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
    private readonly ptcPackageRepository: PtcPackageRepository,
  ) {}

  
  async createSession(userId: string, priceId: string) {
    this.logger.log(`Iniciando creación de sesión de pago para usuario ${userId} con priceId ${priceId}`);

    
    const ptcPackage = await this.ptcPackageRepository.findByPriceId(priceId);
    
    if (!ptcPackage) {
      this.logger.error(`PriceId no reconocido o no está activo en la base de datos: ${priceId}`);
      throw new BadRequestException('El paquete de PTC seleccionado no es válido o no está disponible.');
    }

    const ptcAmount = ptcPackage.ptcAmount;
    const successUrl = this.configService.get<string>('STRIPE_SUCCESS_URL')!;
    const cancelUrl = this.configService.get<string>('STRIPE_CANCEL_URL')!;

    try {
      const session = await this.stripeService.createCheckoutSession({
        priceId,
        successUrl: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: cancelUrl,
        metadata: {
          userId,
          coinsAmount: ptcAmount.toString(),
          type: 'ptc_purchase',
        },
      });

      this.logger.log(`Sesión de Checkout creada exitosamente: ${session.id} para ${ptcAmount} PTC`);
      return {
        url: session.url,
        sessionId: session.id,
      };
    } catch (error) {
      this.logger.error(`Error al crear sesión de Stripe: ${error.message}`);
      throw error;
    }
  }

  
  async getAvailablePackages() {
    return await this.ptcPackageRepository.findAllActive();
  }
}
