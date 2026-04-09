import { Inject, Injectable } from '@nestjs/common';
import { CREATORS_RANKINGS_REPOSITORY } from './infrastructure/postgres.creators-rankings.repository';
import type { ICreatorsRankingsRepository } from './infrastructure/postgres.creators-rankings.repository';
import { CreatorRankingResponse } from './creators-rankings.models';

@Injectable()
export class CreatorsRankingsHandler {
  constructor(
    @Inject(CREATORS_RANKINGS_REPOSITORY)
    private readonly repository: ICreatorsRankingsRepository,
  ) {}

  /**
   * Obtiene la lista de creadoras con mayor rating basado en reacciones.
   * El cálculo es exacto y se basa en la agregación en tiempo real de la tabla post_reactions.
   */
  async handle(limit: number = 10): Promise<CreatorRankingResponse[]> {
    const rankings = await this.repository.getTopCreators(limit);

    return rankings.map(ranking => ({
      userId: ranking.userId,
      username: ranking.username,
      fullName: ranking.fullName,
      avatarUrl: ranking.avatarUrl || undefined,
      totalReactions: ranking.totalReactions,
      rating: ranking.totalReactions, // Se define el rating como el score de reacciones sociales
    }));
  }
}
