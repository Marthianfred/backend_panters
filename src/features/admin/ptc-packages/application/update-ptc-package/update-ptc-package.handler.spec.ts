import { Test, TestingModule } from '@nestjs/testing';
import { UpdatePtcPackageHandler } from './update-ptc-package.handler';
import { PTC_PACKAGE_REPOSITORY } from '../../domain/ptc-package.repository.interface';
import { UpdatePtcPackageDto } from '../../dto/update-ptc-package.dto';
import { NotFoundException } from '@nestjs/common';

describe('UpdatePtcPackageHandler', () => {
  let handler: UpdatePtcPackageHandler;
  let repository: any;

  beforeEach(async () => {
    repository = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdatePtcPackageHandler,
        {
          provide: PTC_PACKAGE_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    handler = module.get<UpdatePtcPackageHandler>(UpdatePtcPackageHandler);
  });

  it('debería actualizar un paquete de PTC correctamente', async () => {
    const id = 'uuid-123';
    const dto: UpdatePtcPackageDto = { name: 'Updated Name' };
    const existing = { id, name: 'Old Name' };
    
    repository.findById.mockResolvedValue(existing);
    repository.update.mockResolvedValue({ ...existing, ...dto });

    const result = await handler.handle(id, dto);

    expect(result.name).toBe('Updated Name');
    expect(repository.update).toHaveBeenCalledWith(id, dto);
  });

  it('debería lanzar NotFoundException si el paquete no existe', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(handler.handle('invalid-id', {})).rejects.toThrow(NotFoundException);
  });
});
