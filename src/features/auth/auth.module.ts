import { Module, Global } from '@nestjs/common';
import { AuthController } from './api/auth.controller';
import { AuthService } from './application/auth.service';
import { BetterAuthProvider } from './infrastructure/better-auth.provider';
import { AuthGuard } from './guards/auth.guard';
import { AuthSeedingService } from './infrastructure/auth-seeding.service';

@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, BetterAuthProvider, AuthGuard, AuthSeedingService],
  exports: [AuthService, AuthGuard, BetterAuthProvider],
})
export class AuthModule {}
