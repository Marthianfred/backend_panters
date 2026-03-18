import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GetPantersController } from './get-panters/get-panters.controller';
import { GetPantersHandler } from './get-panters/get-panters.handler';
import { PostgresPantersRepository } from './get-panters/infrastructure/postgres.panters.repository';
import { PANTERS_REPOSITORY } from './get-panters/interfaces/panters.repository.interface';
import { DatabaseModule } from '../../core/database/database.module';

import { RatePanterController } from './rate-panter/rate-panter.controller';
import { RatePanterHandler } from './rate-panter/rate-panter.handler';
import { PostgresPanterRatingRepository } from './rate-panter/infrastructure/postgres.rate-panter.repository';
import { PANTER_RATING_REPOSITORY } from './rate-panter/interfaces/rate-panter.repository.interface';
import { PostReactionsController } from './post-reactions/post-reactions.controller';
import { ReactToPostHandler } from './post-reactions/post-reactions.handler';
import { POST_REACTION_REPOSITORY_TOKEN } from './post-reactions/interfaces/post-reactions.repository.interface';
import { PostgresPostReactionRepository } from './post-reactions/infrastructure/postgres.post-reactions.repository';
import { POST_REACTION_EVENT_PUBLISHER_TOKEN } from './post-reactions/interfaces/post-reactions-event-publisher.interface';
import { AwsKinesisWallReactionPublisher } from './post-reactions/infrastructure/aws-kinesis.wall-reaction-publisher';

@Module({
  imports: [DatabaseModule, ConfigModule],
  controllers: [GetPantersController, RatePanterController, PostReactionsController],
  providers: [
    GetPantersHandler,
    {
      provide: PANTERS_REPOSITORY,
      useClass: PostgresPantersRepository,
    },
    RatePanterHandler,
    {
      provide: PANTER_RATING_REPOSITORY,
      useClass: PostgresPanterRatingRepository,
    },
    ReactToPostHandler,
    {
      provide: POST_REACTION_REPOSITORY_TOKEN,
      useClass: PostgresPostReactionRepository,
    },
    {
      provide: POST_REACTION_EVENT_PUBLISHER_TOKEN,
      useClass: AwsKinesisWallReactionPublisher,
    },
  ],
})
export class PantersModule {}
