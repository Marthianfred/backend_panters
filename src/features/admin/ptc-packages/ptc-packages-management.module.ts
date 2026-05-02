import { Module } from '@nestjs/common';
import { AuthModule } from '@/features/auth/auth.module';
import { PtcPackagesManagementController } from './ptc-packages-management.controller';
import { PostgresPtcPackageRepository } from './infrastructure/postgres-ptc-package.repository';
import { PTC_PACKAGE_REPOSITORY } from './domain/ptc-package.repository.interface';

import { CreatePtcPackageHandler } from './application/create-ptc-package/create-ptc-package.handler';
import { UpdatePtcPackageHandler } from './application/update-ptc-package/update-ptc-package.handler';
import { DeactivatePtcPackageHandler } from './application/deactivate-ptc-package/deactivate-ptc-package.handler';
import { ActivatePtcPackageHandler } from './application/activate-ptc-package/activate-ptc-package.handler';
import { ListPtcPackagesHandler } from './application/list-ptc-packages/list-ptc-packages.handler';

@Module({
  imports: [AuthModule],
  controllers: [PtcPackagesManagementController],
  providers: [
    {
      provide: PTC_PACKAGE_REPOSITORY,
      useClass: PostgresPtcPackageRepository,
    },
    CreatePtcPackageHandler,
    UpdatePtcPackageHandler,
    DeactivatePtcPackageHandler,
    ActivatePtcPackageHandler,
    ListPtcPackagesHandler,
  ],
})
export class PtcPackagesManagementModule {}
