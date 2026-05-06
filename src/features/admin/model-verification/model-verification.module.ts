import { Module } from '@nestjs/common';
import { AdminVerificationController } from './api/admin-verification.controller';
import { VerifyModelUseCase } from './application/use-cases/verify-model/verify-model.use-case';
import { GetPendingVerificationsUseCase } from './application/use-cases/get-pending-verifications/get-pending-verifications.use-case';
import { NotificationsModule } from '@/features/notifications/notifications.module';
import { AuthModule } from '@/features/auth/auth.module';

@Module({
  imports: [NotificationsModule, AuthModule],
  controllers: [AdminVerificationController],
  providers: [VerifyModelUseCase, GetPendingVerificationsUseCase],
})
export class ModelVerificationModule {}
