import { Injectable, Inject } from '@nestjs/common';
import type { IPtcPackageRepository } from '../../domain/ptc-package.repository.interface';
import { PTC_PACKAGE_REPOSITORY } from '../../domain/ptc-package.repository.interface';
import { CreatePtcPackageDto } from '../../dto/create-ptc-package.dto';
import type { PtcPackageEntity } from '../../domain/ptc-package.entity';

@Injectable()
export class CreatePtcPackageHandler {
  constructor(
    @Inject(PTC_PACKAGE_REPOSITORY)
    private readonly ptcPackageRepository: IPtcPackageRepository,
  ) {}

  async handle(dto: CreatePtcPackageDto): Promise<PtcPackageEntity> {
    return await this.ptcPackageRepository.create({
      name: dto.name,
      ptcAmount: dto.ptcAmount,
      priceUsd: dto.priceUsd,
      stripePriceId: dto.stripePriceId,
      isActive: dto.isActive ?? true,
    });
  }
}
