import { Injectable, Inject } from '@nestjs/common';
import type { IPantersRepository } from './interfaces/panters.repository.interface';
import { PANTERS_REPOSITORY } from './interfaces/panters.repository.interface';
import type {
  GetPantersRequest,
  GetPantersResponse,
} from './get-panters.models';

@Injectable()
export class GetPantersHandler {
  constructor(
    @Inject(PANTERS_REPOSITORY)
    private readonly pantersRepository: IPantersRepository,
  ) {}

  public async execute(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    request: GetPantersRequest,
  ): Promise<GetPantersResponse> {
    const rawPanters = await this.pantersRepository.getAllPanters();

    const panters = rawPanters.map((panter) => {
      // Parse JSON from database if it's treated as string initially,
      // pg might return an object already for jsonb, but we ensure it's an array.
      let parsedServices: import('./interfaces/panters.repository.interface').PanterServiceItem[] =
        [];
      if (typeof panter.services === 'string') {
        try {
          parsedServices = JSON.parse(
            panter.services as string,
          ) as import('./interfaces/panters.repository.interface').PanterServiceItem[];
        } catch {
          parsedServices = [];
        }
      } else if (Array.isArray(panter.services)) {
        parsedServices = panter.services;
      }

      return {
        id: panter.id,
        userId: panter.userId,
        fullName: panter.fullName,
        avatarUrl: panter.avatarUrl,
        isOnline: Boolean(panter.isOnline),
        reviewsCount: Number(panter.reviewsCount) || 0,
        isVip: Boolean(panter.isVip),
        services: parsedServices,
      };
    });

    return { panters };
  }

  public async getRanking(limit: number = 6): Promise<GetPantersResponse> {
    const rawPanters = await this.pantersRepository.getRanking(limit);

    const panters = rawPanters.map((panter) => ({
      id: panter.id,
      userId: panter.userId,
      fullName: panter.fullName,
      avatarUrl: panter.avatarUrl,
      isOnline: Boolean(panter.isOnline),
      reviewsCount: Number(panter.reviewsCount) || 0,
      isVip: Boolean(panter.isVip),
      services: [], // Services might not be needed for ranking display
    }));

    return { panters };
  }
}
