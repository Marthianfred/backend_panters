import { Injectable, Inject } from '@nestjs/common';
import type { 
  ISendGiftRepository, 
} from './interfaces/send-gift.repository.interface';
import { SEND_GIFT_REPOSITORY } from './interfaces/send-gift.repository.interface';
import { LiveChatGateway } from '../../live-chat/infrastructure/live-chat.gateway';
import { KinesisDataPublisherService } from '@/core/infrastructure/kinesis-data/kinesis-data-publisher.service';
import {
  SendGiftRequest,
  SendGiftResponse,
  GiftNotFoundError,
  CreatorNotFoundError,
  UserNotFoundError,
  InsufficientBalanceError,
  SendGiftFailedError,
} from './send-gift.models';

@Injectable()
export class SendGiftHandler {
  constructor(
    @Inject(SEND_GIFT_REPOSITORY)
    private readonly repository: ISendGiftRepository,
    private readonly liveChatGateway: LiveChatGateway,
    private readonly kinesisService: KinesisDataPublisherService,
  ) {}

  public async execute(request: SendGiftRequest): Promise<SendGiftResponse> {
    
    const gift = await this.repository.getGiftById(request.giftId);
    if (!gift) {
      throw new GiftNotFoundError(request.giftId);
    }

    
    const userExists = await this.repository.userExists(request.userId);
    if (!userExists) {
      throw new UserNotFoundError(request.userId);
    }

    
    const creatorExists = await this.repository.userExists(request.creatorId);
    if (!creatorExists) {
      throw new CreatorNotFoundError(request.creatorId);
    }

    
    
    const result = await this.repository.processGiftTransaction(
      request.userId,
      request.creatorId,
      gift,
    );

    if (!result) {
      
      throw new InsufficientBalanceError(request.userId);
    }

    try {
      
      
      
      this.liveChatGateway.broadcastGift(
        request.creatorId,
        'Usuario', 
        gift.name,
        gift.iconUrl,
        gift.id
      );
      
      
      await this.kinesisService.publish(
        'GIFT_SENT',
        {
          transactionId: result.transactionId,
          userId: request.userId,
          creatorId: request.creatorId,
          giftId: gift.id,
          giftName: gift.name,
          amount: gift.priceCoins,
        },
        request.creatorId, 
      );

      return {
        transactionId: result.transactionId,
        remainingBalance: result.remainingBalance,
      };
    } catch (error) {
       
       
       console.error('Error al emitir evento de regalo vía Socket:', error);
       return {
         transactionId: result.transactionId,
         remainingBalance: result.remainingBalance,
       };
    }
  }
}
