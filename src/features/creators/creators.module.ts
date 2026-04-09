import { Module } from '@nestjs/common';
import { CreatorsRankingsController } from './rankings/creators-rankings.controller';
import { CreatorsRankingsHandler } from './rankings/creators-rankings.handler';
import { CREATORS_RANKINGS_REPOSITORY, PostgresCreatorsRankingsRepository } from './rankings/infrastructure/postgres.creators-rankings.repository';

@Module({
  controllers: [CreatorsRankingsController],
  providers: [
    CreatorsRankingsHandler,
    {
      provide: CREATORS_RANKINGS_REPOSITORY,
      useClass: PostgresCreatorsRankingsRepository,
    },
  ],
})
export class CreatorsModule {}
