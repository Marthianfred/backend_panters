import { Module } from '@nestjs/common';
import { GetPantersController } from './get-panters/get-panters.controller';
import { GetPantersHandler } from './get-panters/get-panters.handler';
import { PostgresPantersRepository } from './get-panters/infrastructure/postgres.panters.repository';
import { PANTERS_REPOSITORY } from './get-panters/interfaces/panters.repository.interface';
import { DatabaseModule } from '../../core/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [GetPantersController],
  providers: [
    GetPantersHandler,
    {
      provide: PANTERS_REPOSITORY,
      useClass: PostgresPantersRepository,
    },
  ],
})
export class PantersModule {}
