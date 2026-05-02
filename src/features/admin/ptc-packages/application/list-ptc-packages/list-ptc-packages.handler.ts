import { Injectable, Inject } from '@nestjs/common';
import type { IPtcPackageRepository } from '../../domain/ptc-package.repository.interface';
import { PTC_PACKAGE_REPOSITORY } from '../../domain/ptc-package.repository.interface';
import type { PtcPackageEntity } from '../../domain/ptc-package.entity';

@Injectable()
export class ListPtcPackagesHandler {
  constructor(
    @Inject(PTC_PACKAGE_REPOSITORY)
    private readonly ptcPackageRepository: IPtcPackageRepository,
  ) {}

  async handle(): Promise<PtcPackageEntity[]> {
    return await this.ptcPackageRepository.findAll();
  }
}
