import { Injectable, Inject } from '@nestjs/common';
import type { 
  ISendGiftRepository, 
} from './interfaces/send-gift.repository.interface';
import { SEND_GIFT_REPOSITORY } from './interfaces/send-gift.repository.interface';
import { LiveChatGateway } from '../../live-chat/infrastructure/live-chat.gateway';
import {
  SendGiftRequest,
  SendGiftResponse,
  GiftNotFoundError,
  InsufficientBalanceError,
  SendGiftFailedError,
} from './send-gift.models';

@Injectable()
export class SendGiftHandler {
  constructor(
    @Inject(SEND_GIFT_REPOSITORY)
    private readonly repository: ISendGiftRepository,
    private readonly liveChatGateway: LiveChatGateway,
  ) {}

  public async execute(request: SendGiftRequest): Promise<SendGiftResponse> {
    // 1. Obtener definición del regalo
    const gift = await this.repository.getGiftById(request.giftId);
    if (!gift) {
      throw new GiftNotFoundError(request.giftId);
    }

    // 2. Procesar transacción atómica en DB (PostgreSQL)
    // Este método maneja el split 70/30 y la deducción de saldo
    const result = await this.repository.processGiftTransaction(
      request.userId,
      request.creatorId,
      gift,
    );

    if (!result) {
      // Si falla sin error lanzado, asumimos saldo insuficiente o error de concurrencia
      throw new InsufficientBalanceError(request.userId);
    }

    try {
      // 3. Notificar en tiempo real vía WebSockets (LiveChatGateway)
      // Obtenemos el nombre del usuario (en una implementación real vendría del Auth o Request)
      // Simulamos 'Usuario' por ahora para la demo
      this.liveChatGateway.broadcastGift(
        request.creatorId,
        'Usuario', // Esto se podría expandir obteniendo el perfil del usuario
        gift.name,
        gift.iconUrl,
        gift.id
      );

      return {
        transactionId: result.transactionId,
        remainingBalance: result.remainingBalance,
      };
    } catch (error) {
       // La transacción ya ocurrió en DB, el fallo del socket no debe revertirla, 
       // pero la reportamos.
       console.error('Error al emitir evento de regalo vía Socket:', error);
       return {
         transactionId: result.transactionId,
         remainingBalance: result.remainingBalance,
       };
    }
  }
}
