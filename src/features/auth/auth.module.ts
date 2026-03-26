import { Module, Global, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AuthController } from './api/auth.controller';
import { AuthService } from './application/auth.service';
import { BetterAuthProvider } from './infrastructure/better-auth.provider';
import { AuthGuard } from './guards/auth.guard';
import { AuthSeedingService } from './infrastructure/auth-seeding.service';
import { AuthMiddleware } from './auth.middleware';
import { DatabaseModule } from '@/core/database/database.module';

@Global()
@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    BetterAuthProvider,
    AuthGuard,
    AuthSeedingService,
    AuthMiddleware,
  ],
  exports: [AuthService, AuthGuard, BetterAuthProvider],
})
export class AuthModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    // Registramos el middleware para que se ejecute en todas las rutas
    // Esto permite que todos los endpoints identifiquen al usuario si está logueado
    consumer.apply(AuthMiddleware).forRoutes('*');
  }
}
