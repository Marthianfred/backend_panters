import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IPtcPackageRepository } from '../../domain/ptc-package.repository.interface';
import { PTC_PACKAGE_REPOSITORY } from '../../domain/ptc-package.repository.interface';
import { UpdatePtcPackageDto } from '../../dto/update-ptc-package.dto';
import type { PtcPackageEntity } from '../../domain/ptc-package.entity';

@Injectable()
export class UpdatePtcPackageHandler {
  constructor(
    @Inject(PTC_PACKAGE_REPOSITORY)
    private readonly ptcPackageRepository: IPtcPackageRepository,
  ) {}

  async handle(
    id: string,
    dto: UpdatePtcPackageDto,
  ): Promise<PtcPackageEntity> {
    const existing = await this.ptcPackageRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Paquete de PTC con ID ${id} no encontrado`);
    }

    return await this.ptcPackageRepository.update(id, dto);
  }
}
