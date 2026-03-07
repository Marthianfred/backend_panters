import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { GetProfileController } from './get-profile/get-profile.controller';
import { GetProfileHandler } from './get-profile/get-profile.handler';
import { PostgresProfileRepository } from './get-profile/infrastructure/postgres.profile.repository';
import { PROFILE_REPOSITORY } from './get-profile/interfaces/profile.repository.interface';

@Module({
  imports: [AuthModule],
  controllers: [GetProfileController],
  providers: [
    GetProfileHandler,
    {
      provide: PROFILE_REPOSITORY,
      useClass: PostgresProfileRepository,
    },
  ],
})
export class ProfilesModule {}
