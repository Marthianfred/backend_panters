import { Module, Global, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AuthController } from './api/auth.controller';
import { AuthService } from './application/auth.service';
import { RegisterClientService } from './application/register-client.service';
import { BetterAuthProvider, AuthPoolProvider } from './infrastructure/better-auth.provider';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthSeedingService } from './infrastructure/auth-seeding.service';
import { AuthMiddleware } from './auth.middleware';
import { DatabaseModule } from '@/core/database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CheckUserActivityUseCase } from './application/use-cases/check-user-activity.use-case';

@Global()
@Module({
  imports: [DatabaseModule, NotificationsModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    RegisterClientService,
    AuthPoolProvider,
    BetterAuthProvider,
    AuthGuard,

    RolesGuard,
    AuthSeedingService,
    AuthMiddleware,
    CheckUserActivityUseCase,
  ],
  exports: [AuthService, AuthGuard, RolesGuard, BetterAuthProvider, RegisterClientService],
})
export class AuthModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    
    
    consumer.apply(AuthMiddleware).forRoutes('*');
  }
}
