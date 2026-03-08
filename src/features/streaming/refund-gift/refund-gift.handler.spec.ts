import { Test, TestingModule } from '@nestjs/testing';
import { RefundGiftHandler } from './refund-gift.handler';
import { REFUND_GIFT_REPOSITORY } from './interfaces/refund-gift.repository.interface';
import { TransactionNotFoundError } from './refund-gift.models';

describe('RefundGiftHandler', () => {
  let handler: RefundGiftHandler;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      processRefundTransaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefundGiftHandler,
        { provide: REFUND_GIFT_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    handler = module.get<RefundGiftHandler>(RefundGiftHandler);
  });

  it('debe lanzar TransactionNotFoundError si la transacción no existe', async () => {
    mockRepository.processRefundTransaction.mockResolvedValue(null);
    await expect(handler.execute({ transactionId: 'invalid-id' }))
      .rejects.toThrow(TransactionNotFoundError);
  });

  it('debe procesar el reembolso exitosamente', async () => {
    const mockResult = {
      refundTransactionId: 'ref-123',
      newBalance: 150,
    };
    mockRepository.processRefundTransaction.mockResolvedValue(mockResult);

    const result = await handler.execute({ transactionId: 'trans-123', reason: 'Error de red' });

    expect(mockRepository.processRefundTransaction).toHaveBeenCalledWith('trans-123', 'Error de red');
    expect(result).toEqual(mockResult);
  });
});
