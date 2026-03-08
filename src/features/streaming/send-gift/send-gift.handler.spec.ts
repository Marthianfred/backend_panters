import { Test, TestingModule } from '@nestjs/testing';
import { SendGiftHandler } from './send-gift.handler';
import { SEND_GIFT_REPOSITORY } from './interfaces/send-gift.repository.interface';
import { LiveChatGateway } from '../../live-chat/infrastructure/live-chat.gateway';
import { GiftNotFoundError, InsufficientBalanceError } from './send-gift.models';

describe('SendGiftHandler', () => {
  let handler: SendGiftHandler;
  let mockRepository: any;
  let mockGateway: any;

  beforeEach(async () => {
    mockRepository = {
      getGiftById: jest.fn(),
      processGiftTransaction: jest.fn(),
    };
    mockGateway = {
      broadcastGift: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendGiftHandler,
        { provide: SEND_GIFT_REPOSITORY, useValue: mockRepository },
        { provide: LiveChatGateway, useValue: mockGateway },
      ],
    }).compile();

    handler = module.get<SendGiftHandler>(SendGiftHandler);
  });

  it('debe lanzar GiftNotFoundError si el regalo no existe', async () => {
    mockRepository.getGiftById.mockResolvedValue(null);
    await expect(handler.execute({ userId: 'u1', creatorId: 'c1', giftId: 'g1' }))
      .rejects.toThrow(GiftNotFoundError);
  });

  it('debe procesar el regalo y emitir evento vía socket exitosamente', async () => {
    const mockGift = { id: 'g1', name: 'Rosa', priceCoins: 5, iconUrl: 'rose' };
    mockRepository.getGiftById.mockResolvedValue(mockGift);
    mockRepository.processGiftTransaction.mockResolvedValue({
      transactionId: 't1',
      remainingBalance: 95
    });

    const result = await handler.execute({ userId: 'u1', creatorId: 'c1', giftId: 'g1' });

    expect(mockRepository.processGiftTransaction).toHaveBeenCalledWith('u1', 'c1', mockGift);
    expect(mockGateway.broadcastGift).toHaveBeenCalledWith('c1', 'Usuario', 'Rosa', 'rose', 'g1');
    expect(result.remainingBalance).toBe(95);
  });

  it('debe lanzar InsufficientBalanceError si la transacción falla en DB por saldo', async () => {
    mockRepository.getGiftById.mockResolvedValue({ id: 'g1', priceCoins: 100 });
    mockRepository.processGiftTransaction.mockResolvedValue(null);

    await expect(handler.execute({ userId: 'u1', creatorId: 'c1', giftId: 'g1' }))
      .rejects.toThrow(InsufficientBalanceError);
  });
});
