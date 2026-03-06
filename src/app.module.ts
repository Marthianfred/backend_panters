import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@/core/database/database.module';
import { AuthModule } from '@/features/auth/auth.module';
import { StreamingModule } from '@/features/streaming/streaming.module';
import { WalletModule } from '@/features/wallet/wallet.module';
import { ProfilesModule } from '@/features/profiles/profiles.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
    StreamingModule,
    WalletModule,
    ProfilesModule,
  ],
})
export class AppModule {}
