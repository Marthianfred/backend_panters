import { Module } from '@nestjs/common';
import { AuthController } from '@/features/auth/api/auth.controller';
import { AuthService } from '@/features/auth/application/auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
