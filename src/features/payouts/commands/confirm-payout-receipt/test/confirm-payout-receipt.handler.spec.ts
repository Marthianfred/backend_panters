import { Test, TestingModule } from '@nestjs/testing';
import { ConfirmPayoutReceiptHandler } from '../confirm-payout-receipt.handler';
import { ConfirmPayoutReceiptCommand } from '../confirm-payout-receipt.command';
import { IPayoutsRepository } from '../../../interfaces/payouts.repository.interface';
import { PayoutStatus } from '../../../enums/payout-status.enum';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('ConfirmPayoutReceiptHandler', () => {
  let handler: ConfirmPayoutReceiptHandler;
  let repository: IPayoutsRepository;

  const mockRepository = {
    findById: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfirmPayoutReceiptHandler,
        {
          provide: 'IPayoutsRepository',
          useValue: mockRepository,
        },
      ],
    }).compile();

    handler = module.get<ConfirmPayoutReceiptHandler>(
      ConfirmPayoutReceiptHandler,
    );
    repository = module.get<IPayoutsRepository>('IPayoutsRepository');
  });

  it('should confirm payout receipt', async () => {
    const command = new ConfirmPayoutReceiptCommand({
      payoutId: 'payout-123',
      creatorId: 'creator-123',
    });

    const mockPayout = {
      id: 'payout-123',
      creatorId: 'creator-123',
      status: PayoutStatus.PENDING_RECEIPT_CONFIRMATION,
    };

    mockRepository.findById.mockResolvedValue(mockPayout);
    mockRepository.updateStatus.mockResolvedValue(undefined);

    await handler.execute(command);

    expect(repository.updateStatus).toHaveBeenCalledWith(
      'payout-123',
      PayoutStatus.COMPLETED,
      expect.any(Object),
    );
  });

  it('should throw if creator does not match', async () => {
    const command = new ConfirmPayoutReceiptCommand({
      payoutId: 'payout-123',
      creatorId: 'wrong-creator',
    });

    const mockPayout = {
      id: 'payout-123',
      creatorId: 'creator-123',
      status: PayoutStatus.PENDING_RECEIPT_CONFIRMATION,
    };

    mockRepository.findById.mockResolvedValue(mockPayout);

    await expect(handler.execute(command)).rejects.toThrow(ForbiddenException);
  });

  it('should throw if status is not pending confirmation', async () => {
    const command = new ConfirmPayoutReceiptCommand({
      payoutId: 'payout-123',
      creatorId: 'creator-123',
    });

    const mockPayout = {
      id: 'payout-123',
      creatorId: 'creator-123',
      status: PayoutStatus.PENDING_APPROVAL,
    };

    mockRepository.findById.mockResolvedValue(mockPayout);

    await expect(handler.execute(command)).rejects.toThrow(BadRequestException);
  });
});
