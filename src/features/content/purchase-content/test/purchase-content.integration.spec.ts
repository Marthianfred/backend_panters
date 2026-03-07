import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { PurchaseContentHandler } from '../purchase-content.handler';
import { CONTENT_REPOSITORY_TOKEN } from '../../interfaces/content.repository.interface';
import { PostgresContentRepository } from '../../infrastructure/postgres.content.repository';
import { P2P_TRANSACTION_SERVICE_TOKEN } from '../interfaces/p2p-transaction.service.interface';
import { PostgresP2PTransactionService } from '../infrastructure/postgres.p2p.service';
import {
  ContentNotFoundError,
  InsufficientCoinsError,
} from '../purchase-content.models';

describe('PurchaseContent (Integration)', () => {
  let handler: PurchaseContentHandler;
  let pool: Pool;
  let configService: ConfigService;

  const TEST_CREATOR_ID = 'creator-id-test-123';
  const TEST_SUBSCRIBER_ID = 'subscriber-id-test-456';
  const TEST_CONTENT_ID = '00000000-0000-0000-0000-000000000001';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [
        PurchaseContentHandler,
        {
          provide: CONTENT_REPOSITORY_TOKEN,
          useClass: PostgresContentRepository,
        },
        {
          provide: P2P_TRANSACTION_SERVICE_TOKEN,
          useClass: PostgresP2PTransactionService,
        },
      ],
    }).compile();

    handler = module.get<PurchaseContentHandler>(PurchaseContentHandler);
    configService = module.get<ConfigService>(ConfigService);

    pool = new Pool({
      connectionString: configService.getOrThrow<string>('DATABASE_URL'),
    });

    // Limpieza inicial de datos de prueba
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
    await pool.end();
  });

  async function cleanup() {
    await pool.query(
      'DELETE FROM content_purchases WHERE user_id = $1 OR user_id = $2',
      [TEST_SUBSCRIBER_ID, TEST_CREATOR_ID],
    );
    await pool.query(
      'DELETE FROM wallet_transactions WHERE wallet_id IN (SELECT id FROM antigravity_wallets WHERE user_id = $1 OR user_id = $2)',
      [TEST_SUBSCRIBER_ID, TEST_CREATOR_ID],
    );
    await pool.query('DELETE FROM creator_wallets WHERE creator_id = $1', [
      TEST_CREATOR_ID,
    ]);
    await pool.query(
      'DELETE FROM antigravity_wallets WHERE user_id = $1 OR user_id = $2',
      [TEST_SUBSCRIBER_ID, TEST_CREATOR_ID],
    );
    await pool.query('DELETE FROM content_items WHERE id = $1', [
      TEST_CONTENT_ID,
    ]);
    await pool.query('DELETE FROM "user" WHERE id = $1 OR id = $2', [
      TEST_CREATOR_ID,
      TEST_SUBSCRIBER_ID,
    ]);
  }

  it('debe completar una compra exitosa con split 70/30', async () => {
    // 1. SEED: Crear usuarios
    await pool.query(
      'INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt", role) VALUES ($1, $2, $3, $4, NOW(), NOW(), $5)',
      [TEST_CREATOR_ID, 'Creadora Test', 'creator@test.com', true, 'creator'],
    );
    await pool.query(
      'INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt", role) VALUES ($1, $2, $3, $4, NOW(), NOW(), $5)',
      [
        TEST_SUBSCRIBER_ID,
        'Subscriber Test',
        'sub@test.com',
        true,
        'subscriber',
      ],
    );

    // 2. SEED: Crear billetera con 100 Panter Coins
    await pool.query(
      'INSERT INTO antigravity_wallets (user_id, panter_coin_balance) VALUES ($1, $2)',
      [TEST_SUBSCRIBER_ID, 100],
    );

    // 3. SEED: Crear contenido de 50 Panter Coins
    await pool.query(
      'INSERT INTO content_items (id, creator_id, title, type, price_coins, file_url, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        TEST_CONTENT_ID,
        TEST_CREATOR_ID,
        'Video Premium',
        'video',
        50,
        's3://bucket/video.mp4',
        'published',
      ],
    );

    // 4. EJECUTAR COMPRA
    const result = await handler.execute({
      subscriberId: TEST_SUBSCRIBER_ID,
      contentId: TEST_CONTENT_ID,
    });

    // 5. VERIFICAR RESPONSE
    expect(result.success).toBe(true);
    expect(result.signedDeliveryUrl).toBeDefined();

    // 6. VERIFICAR DB: Saldo Suscriptor (100 - 50 = 50)
    const subWallet = await pool.query<{ panter_coin_balance: string }>(
      'SELECT panter_coin_balance FROM antigravity_wallets WHERE user_id = $1',
      [TEST_SUBSCRIBER_ID],
    );
    expect(parseFloat(subWallet.rows[0].panter_coin_balance)).toBe(50);

    // 7. VERIFICAR DB: Saldo Creadora (50 * 0.7 = 35)
    const creatorWallet = await pool.query<{
      net_balance: string;
      platform_commission: string;
    }>(
      'SELECT net_balance, platform_commission FROM creator_wallets WHERE creator_id = $1',
      [TEST_CREATOR_ID],
    );
    expect(parseFloat(creatorWallet.rows[0].net_balance)).toBe(35);
    expect(parseFloat(creatorWallet.rows[0].platform_commission)).toBe(15);

    // 8. VERIFICAR DB: Registro de compra
    const purchase = await pool.query<{ price_paid: string }>(
      'SELECT * FROM content_purchases WHERE user_id = $1 AND content_item_id = $2',
      [TEST_SUBSCRIBER_ID, TEST_CONTENT_ID],
    );
    expect(purchase.rows.length).toBe(1);
    expect(parseFloat(purchase.rows[0].price_paid)).toBe(50);
  });

  it('debe fallar si el suscriptor no tiene saldo suficiente', async () => {
    // 1. SEED: Billetera con poco saldo (10 coins)
    await pool.query(
      'UPDATE antigravity_wallets SET panter_coin_balance = 10 WHERE user_id = $1',
      [TEST_SUBSCRIBER_ID],
    );

    // 2. EJECUTAR Y ESPERAR ERROR
    await expect(
      handler.execute({
        subscriberId: TEST_SUBSCRIBER_ID,
        contentId: TEST_CONTENT_ID,
      }),
    ).rejects.toThrow(InsufficientCoinsError);
  });

  it('debe fallar si el contenido no existe', async () => {
    await expect(
      handler.execute({
        subscriberId: TEST_SUBSCRIBER_ID,
        contentId: '00000000-0000-0000-0000-000000000999',
      }),
    ).rejects.toThrow(ContentNotFoundError);
  });
});
