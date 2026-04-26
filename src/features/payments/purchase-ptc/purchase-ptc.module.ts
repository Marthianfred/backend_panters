import { Module } from '@nestjs/common';
import { PurchasePtcController } from './presentation/purchase-ptc.controller';
import { PurchasePtcService } from './application/purchase-ptc.service';
import { AuthModule } from '@/features/auth/auth.module';
import { PtcPackageRepository } from './infrastructure/ptc-package.repository';

@Module({
  imports: [
    AuthModule,
  ],
  controllers: [PurchasePtcController],
  providers: [
    PurchasePtcService,
    PtcPackageRepository,
  ],
  exports: [PurchasePtcService],
})
export class PurchasePtcModule {}
