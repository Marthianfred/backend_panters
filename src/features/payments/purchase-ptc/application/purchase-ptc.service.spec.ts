import { Test, TestingModule } from '@nestjs/testing';
import { PurchasePtcService } from './purchase-ptc.service';
import { StripeService } from '@/core/infrastructure/stripe/stripe.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { PtcPackageRepository } from '../infrastructure/ptc-package.repository';

describe('PurchasePtcService', () => {
  let service: PurchasePtcService;
  let stripeService: jest.Mocked<StripeService>;
  let ptcPackageRepository: jest.Mocked<PtcPackageRepository>;

  beforeEach(async () => {
    const stripeServiceMock = {
      createCheckoutSession: jest.fn(),
    };
    const ptcPackageRepositoryMock = {
      findByPriceId: jest.fn(),
      findAllActive: jest.fn(),
    };
    const configServiceMock = {
      get: jest.fn((key: string) => {
        if (key === 'STRIPE_SUCCESS_URL') return 'http://success.com';
        if (key === 'STRIPE_CANCEL_URL') return 'http://cancel.com';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchasePtcService,
        { provide: StripeService, useValue: stripeServiceMock },
        { provide: PtcPackageRepository, useValue: ptcPackageRepositoryMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    service = module.get<PurchasePtcService>(PurchasePtcService);
    stripeService = module.get(StripeService);
    ptcPackageRepository = module.get(PtcPackageRepository);
  });

  it('should create a checkout session for a valid priceId found in DB', async () => {
    const userId = 'user-123';
    const priceId = 'price_real_from_stripe';
    const mockPackage = { 
      id: 'uuid-1', 
      name: '100 PTC', 
      ptcAmount: 100, 
      stripePriceId: priceId, 
      isActive: true 
    };
    const mockSession = { id: 'sess_123', url: 'http://stripe.com/checkout' };

    ptcPackageRepository.findByPriceId.mockResolvedValue(mockPackage);
    stripeService.createCheckoutSession.mockResolvedValue(mockSession as any);

    const result = await service.createSession(userId, priceId);

    expect(result).toEqual({
      url: mockSession.url,
      sessionId: mockSession.id,
    });
    expect(ptcPackageRepository.findByPriceId).toHaveBeenCalledWith(priceId);
    expect(stripeService.createCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({
      priceId,
      metadata: expect.objectContaining({
        userId,
        coinsAmount: '100',
      }),
    }));
  });

  it('should throw BadRequestException if priceId is not in DB', async () => {
    const userId = 'user-123';
    const priceId = 'unknown_price_id';

    ptcPackageRepository.findByPriceId.mockResolvedValue(null);

    await expect(service.createSession(userId, priceId)).rejects.toThrow(BadRequestException);
  });
});
