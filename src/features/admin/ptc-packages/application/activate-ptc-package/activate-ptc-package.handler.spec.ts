import { Test, TestingModule } from '@nestjs/testing';
import { ActivatePtcPackageHandler } from './activate-ptc-package.handler';
import {
  IPtcPackageRepository,
  PTC_PACKAGE_REPOSITORY,
} from '../../domain/ptc-package.repository.interface';
import { NotFoundException } from '@nestjs/common';

describe('ActivatePtcPackageHandler', () => {
  let handler: ActivatePtcPackageHandler;
  let repository: jest.Mocked<IPtcPackageRepository>;

  beforeEach(async () => {
    repository = {
      findById: jest.fn(),
      activate: jest.fn(),
    } as unknown as jest.Mocked<IPtcPackageRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivatePtcPackageHandler,
        {
          provide: PTC_PACKAGE_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    handler = module.get<ActivatePtcPackageHandler>(ActivatePtcPackageHandler);
  });

  it('debería activar un paquete correctamente', async () => {
    const id = 'uuid-123';
    repository.findById.mockResolvedValue({ id, isActive: false });
    repository.activate.mockResolvedValue(undefined);

    const result = await handler.handle(id);

    expect(result.success).toBe(true);
    expect(repository.activate).toHaveBeenCalledWith(id);
  });

  it('debería lanzar NotFoundException si el paquete no existe', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(handler.handle('invalid-id')).rejects.toThrow(
      NotFoundException,
    );
  });
});
