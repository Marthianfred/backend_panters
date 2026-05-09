import { Test, TestingModule } from '@nestjs/testing';
import { CreatePayoutRequestHandler } from '../create-payout-request.handler';
import { CreatePayoutRequestCommand } from '../create-payout-request.command';
import { IPayoutsRepository } from '../../../interfaces/payouts.repository.interface';
import { KinesisDataPublisherService } from '@/core/infrastructure/kinesis-data/kinesis-data-publisher.service';
import { PayoutStatus } from '../../../enums/payout-status.enum';

describe('CreatePayoutRequestHandler', () => {
  let handler: CreatePayoutRequestHandler;
  let repository: IPayoutsRepository;
  let kinesisPublisher: KinesisDataPublisherService;

  const mockRepository = {
    reserveBalance: jest.fn(),
    create: jest.fn(),
  };

  const mockKinesisPublisher = {
    publish: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePayoutRequestHandler,
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

    handler = module.get<CreatePayoutRequestHandler>(
      CreatePayoutRequestHandler,
    );
    repository = module.get<IPayoutsRepository>('IPayoutsRepository');
    kinesisPublisher = module.get<KinesisDataPublisherService>(
      KinesisDataPublisherService,
    );
  });

  it('should create a payout request and publish an event', async () => {
    const command = new CreatePayoutRequestCommand({
      creatorId: 'creator-123',
      amount: 100,
    });

    const mockPayout = {
      id: 'payout-123',
      creatorId: 'creator-123',
      amount: 100,
      status: PayoutStatus.PENDING_APPROVAL,
    };

    mockRepository.reserveBalance.mockResolvedValue(undefined);
    mockRepository.create.mockResolvedValue(mockPayout);
    mockKinesisPublisher.publish.mockResolvedValue(undefined);

    const result = await handler.execute(command);

    expect(result).toBe('payout-123');
    expect(repository.reserveBalance).toHaveBeenCalledWith('creator-123', 100);
    expect(repository.create).toHaveBeenCalled();
    expect(kinesisPublisher.publish).toHaveBeenCalledWith(
      'payout.requested',
      expect.any(Object),
      'creator-123',
    );
  });

  it('should throw if balance reservation fails', async () => {
    const command = new CreatePayoutRequestCommand({
      creatorId: 'creator-123',
      amount: 1000,
    });

    mockRepository.reserveBalance.mockRejectedValue(
      new Error('Saldo insuficiente'),
    );

    await expect(handler.execute(command)).rejects.toThrow(
      'Saldo insuficiente',
    );
  });
});
