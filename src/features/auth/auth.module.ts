import { Module, Global } from '@nestjs/common';
import { AuthController } from './api/auth.controller';
import { AuthService } from './application/auth.service';
import { BetterAuthProvider } from './infrastructure/better-auth.provider';
import { AuthGuard } from './guards/auth.guard';

@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, BetterAuthProvider, AuthGuard],
  exports: [AuthService, AuthGuard, BetterAuthProvider],
})
export class AuthModule {}
