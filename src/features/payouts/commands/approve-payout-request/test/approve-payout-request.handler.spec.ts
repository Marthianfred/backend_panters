import { Test, TestingModule } from '@nestjs/testing';
import { ApprovePayoutRequestHandler } from '../approve-payout-request.handler';
import { ApprovePayoutRequestCommand } from '../approve-payout-request.command';
import { IPayoutsRepository } from '../../../interfaces/payouts.repository.interface';
import { KinesisDataPublisherService } from '@/core/infrastructure/kinesis-data/kinesis-data-publisher.service';
import { PayoutStatus } from '../../../enums/payout-status.enum';
import { NotFoundException } from '@nestjs/common';

describe('ApprovePayoutRequestHandler', () => {
  let handler: ApprovePayoutRequestHandler;
  let repository: IPayoutsRepository;
  let kinesisPublisher: KinesisDataPublisherService;

  const mockRepository = {
    findById: jest.fn(),
    updateStatus: jest.fn(),
  };

  const mockKinesisPublisher = {
    publish: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApprovePayoutRequestHandler,
        {
          provide: 'IPayoutsRepository',
          useValue: mockRepository,
        },
        {
          provide: KinesisDataPublisherService,
          useValue: mockKinesisPublisher,
        },
      ],
    }).compile();

    handler = module.get<ApprovePayoutRequestHandler>(
      ApprovePayoutRequestHandler,
    );
    repository = module.get<IPayoutsRepository>('IPayoutsRepository');
    kinesisPublisher = module.get<KinesisDataPublisherService>(
      KinesisDataPublisherService,
    );
  });

  it('should approve a payout request and notify the model', async () => {
    const command = new ApprovePayoutRequestCommand({
      payoutId: 'payout-123',
      adminId: 'admin-456',
    });

    const mockPayout = {
      id: 'payout-123',
      creatorId: 'creator-789',
      amount: 100,
      status: PayoutStatus.PENDING_APPROVAL,
    };

    mockRepository.findById.mockResolvedValue(mockPayout);
    mockRepository.updateStatus.mockResolvedValue(undefined);
    mockKinesisPublisher.publish.mockResolvedValue(undefined);

    await handler.execute(command);

    expect(repository.updateStatus).toHaveBeenCalledWith(
      'payout-123',
      PayoutStatus.PENDING_RECEIPT_CONFIRMATION,
      expect.any(Object),
    );
    expect(kinesisPublisher.publish).toHaveBeenCalledWith(
      'payout.approved',
      expect.any(Object),
      'creator-789',
    );
  });

  it('should throw if payout request not found', async () => {
    const command = new ApprovePayoutRequestCommand({
      payoutId: 'non-existent',
      adminId: 'admin-456',
    });

    mockRepository.findById.mockResolvedValue(null);

    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
  });
});
