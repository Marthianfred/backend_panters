import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IPtcPackageRepository } from '../../domain/ptc-package.repository.interface';
import { PTC_PACKAGE_REPOSITORY } from '../../domain/ptc-package.repository.interface';

@Injectable()
export class ActivatePtcPackageHandler {
  constructor(
    @Inject(PTC_PACKAGE_REPOSITORY)
    private readonly ptcPackageRepository: IPtcPackageRepository,
  ) {}

  async handle(id: string): Promise<{ success: boolean }> {
    const existing = await this.ptcPackageRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Paquete de PTC con ID ${id} no encontrado`);
    }

    await this.ptcPackageRepository.activate(id);
    return { success: true };
  }
}
