import { Test, TestingModule } from '@nestjs/testing';
import { GetTransactionHistoryHandler } from './get-transaction-history.handler';
import { TRANSACTION_REPOSITORY, ITransactionRepository } from './interfaces/transaction.repository.interface';
import { TransactionData } from './get-transaction-history.models';

describe('GetTransactionHistoryHandler', () => {
  let handler: GetTransactionHistoryHandler;
  let repository: ITransactionRepository;

  const mockTransactionRepository = {
    getTransactionsByUserId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTransactionHistoryHandler,
        {
          provide: TRANSACTION_REPOSITORY,
          useValue: mockTransactionRepository,
        },
      ],
    }).compile();

    handler = module.get<GetTransactionHistoryHandler>(GetTransactionHistoryHandler);
    repository = module.get<ITransactionRepository>(TRANSACTION_REPOSITORY);
  });

  it('debería estar definido', () => {
    expect(handler).toBeDefined();
  });

  it('debería retornar una lista de transacciones para un usuario válido con metadata de paginación', async () => {
    const userId = 'user-uuid';
    const page = 1;
    const limit = 10;
    const mockTransactions: TransactionData[] = [
      {
        id: '1',
        type: 'credit',
        amount: 100,
        description: 'Compra de PTC',
        referenceId: 'ref-1',
        createdAt: new Date(),
      },
    ];

    mockTransactionRepository.getTransactionsByUserId.mockResolvedValue({
      transactions: mockTransactions,
      total: 1,
    });

    const result = await handler.execute({ userId, page });

    expect(result.transactions).toEqual(mockTransactions);
    expect(result.meta).toEqual({
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
    expect(repository.getTransactionsByUserId).toHaveBeenCalledWith(userId, page, limit);
  });

  it('debería retornar una lista vacía y totalPages 0 si el usuario no tiene transacciones', async () => {
    const userId = 'user-no-trans';
    const page = 1;
    const limit = 10;
    mockTransactionRepository.getTransactionsByUserId.mockResolvedValue({
      transactions: [],
      total: 0,
    });

    const result = await handler.execute({ userId, page });

    expect(result.transactions).toEqual([]);
    expect(result.meta.totalPages).toBe(0);
    expect(repository.getTransactionsByUserId).toHaveBeenCalledWith(userId, page, limit);
  });
});
