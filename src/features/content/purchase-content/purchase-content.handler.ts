import { Injectable, Inject } from '@nestjs/common';
import type { IContentRepository } from '../interfaces/content.repository.interface';
import { CONTENT_REPOSITORY_TOKEN } from '../interfaces/content.repository.interface';
import type { IP2PTransactionService } from './interfaces/p2p-transaction.service.interface';
import { P2P_TRANSACTION_SERVICE_TOKEN } from './interfaces/p2p-transaction.service.interface';
import type {
  PurchaseContentRequest,
  PurchaseContentResponse,
} from './purchase-content.models';
import {
  ContentNotFoundError,
  InsufficientCoinsError,
} from './purchase-content.models';

@Injectable()
export class PurchaseContentHandler {
  constructor(
    @Inject(CONTENT_REPOSITORY_TOKEN)
    private readonly contentRepository: IContentRepository,
    @Inject(P2P_TRANSACTION_SERVICE_TOKEN)
    private readonly p2pTransactionService: IP2PTransactionService,
  ) {}

  public async execute(
    request: PurchaseContentRequest,
  ): Promise<PurchaseContentResponse> {
    // 1. Validar existencia del contenido
    const content = await this.contentRepository.getContentById(
      request.contentId,
    );

    if (!content) {
      throw new ContentNotFoundError();
    }

    // 2. Ejecutar Transacción P2P Billetera-Creadora (SPLIT 30/70 Interno)
    const txSuccess = await this.p2pTransactionService.executeContentPurchase(
      request.subscriberId,
      content.creatorId,
      content.id,
      content.price,
    );

    if (!txSuccess) {
      throw new InsufficientCoinsError();
    }

    // 3. Generar y entregar AWS CloudFront Signed URL
    const signedDeliveryUrl = `https://cdn.panters.com/${content.id}?Expires=1672531190&Signature=xyz...`;

    return {
      success: true,
      message: 'Compra exitosa. Accediendo al contenido.',
      signedDeliveryUrl,
    };
  }
}
