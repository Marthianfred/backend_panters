import { Test, TestingModule } from '@nestjs/testing';
import { DeactivatePtcPackageHandler } from './deactivate-ptc-package.handler';
import {
  IPtcPackageRepository,
  PTC_PACKAGE_REPOSITORY,
} from '../../domain/ptc-package.repository.interface';
import { NotFoundException } from '@nestjs/common';

describe('DeactivatePtcPackageHandler', () => {
  let handler: DeactivatePtcPackageHandler;
  let repository: jest.Mocked<IPtcPackageRepository>;

  beforeEach(async () => {
    repository = {
      findById: jest.fn(),
      deactivate: jest.fn(),
    } as unknown as jest.Mocked<IPtcPackageRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeactivatePtcPackageHandler,
        {
          provide: PTC_PACKAGE_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    handler = module.get<DeactivatePtcPackageHandler>(
      DeactivatePtcPackageHandler,
    );
  });

  it('debería desactivar un paquete correctamente', async () => {
    const id = 'uuid-123';
    repository.findById.mockResolvedValue({ id, isActive: true });
    repository.deactivate.mockResolvedValue(undefined);

    const result = await handler.handle(id);

    expect(result.success).toBe(true);
    expect(repository.deactivate).toHaveBeenCalledWith(id);
  });

  it('debería lanzar NotFoundException si el paquete no existe', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(handler.handle('invalid-id')).rejects.toThrow(
      NotFoundException,
    );
  });
});
