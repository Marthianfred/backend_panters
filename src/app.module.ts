import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { DatabaseModule } from '@/core/database/database.module';
import { AuthModule } from '@/features/auth/auth.module';
import { StreamingModule } from '@/features/streaming/streaming.module';
import { WalletModule } from '@/features/wallet/wallet.module';
import { ProfilesModule } from '@/features/profiles/profiles.module';
import { ContentModule } from '@/features/content/content.module';
import { PantersModule } from '@/features/panters/panters.module';
import { LiveChatModule } from '@/features/live-chat/live-chat.module';
import { RequestLoggerMiddleware } from '@/core/infrastructure/logger/request-logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MulterModule.register({
      limits: {
        fileSize: 10000 * 1024 * 1024, // 10 GB para asegurar cero errores 413 a nivel global
      },
    }),
    DatabaseModule,
    AuthModule,
    StreamingModule,
    WalletModule,
    ProfilesModule,
    ContentModule,
    PantersModule,
    LiveChatModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    if (process.env.NODE_ENV === 'development') {
      consumer.apply(RequestLoggerMiddleware).forRoutes('*');
    }
  }
}
