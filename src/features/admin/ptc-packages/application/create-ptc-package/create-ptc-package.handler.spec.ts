import { Test, TestingModule } from '@nestjs/testing';
import { CreatePtcPackageHandler } from './create-ptc-package.handler';
import {
  IPtcPackageRepository,
  PTC_PACKAGE_REPOSITORY,
} from '../../domain/ptc-package.repository.interface';
import { CreatePtcPackageDto } from '../../dto/create-ptc-package.dto';

describe('CreatePtcPackageHandler', () => {
  let handler: CreatePtcPackageHandler;
  let repository: jest.Mocked<IPtcPackageRepository>;

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
    } as unknown as jest.Mocked<IPtcPackageRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePtcPackageHandler,
        {
          provide: PTC_PACKAGE_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    handler = module.get<CreatePtcPackageHandler>(CreatePtcPackageHandler);
  });

  it('debería crear un paquete de PTC correctamente', async () => {
    const dto: CreatePtcPackageDto = {
      name: 'Test Pack',
      ptcAmount: 100,
      priceUsd: 10,
      stripePriceId: 'price_123',
      isActive: true,
    };

    const expectedResult = {
      id: 'uuid',
      ...dto,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repository.create.mockResolvedValue(expectedResult);

    const result = await handler.handle(dto);

    expect(result).toEqual(expectedResult);
    expect(repository.create).toHaveBeenCalledWith({
      name: dto.name,
      ptcAmount: dto.ptcAmount,
      priceUsd: dto.priceUsd,
      stripePriceId: dto.stripePriceId,
      isActive: dto.isActive,
    });
  });

  it('debería usar isActive=true por defecto si no se proporciona', async () => {
    const dto: CreatePtcPackageDto = {
      name: 'Test Pack',
      ptcAmount: 100,
      priceUsd: 10,
      stripePriceId: 'price_123',
    };

    await handler.handle(dto);

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: true,
      }),
    );
  });
});
