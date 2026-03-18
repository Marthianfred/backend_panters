import { RatePanterRequest, RatePanterResponse, GetPanterRatingSummaryResponse } from '../rate-panter.models';

export const PANTER_RATING_REPOSITORY = 'PANTER_RATING_REPOSITORY';

export interface IPanterRatingRepository {
  /**
   * Registra o actualiza la calificación de un usuario para una Panter.
   */
  upsertRating(subscriberId: string, data: RatePanterRequest): Promise<RatePanterResponse>;

  /**
   * Obtiene el resumen de calificaciones (promedio y total) de una Panter.
   */
  getRatingSummary(creatorId: string): Promise<GetPanterRatingSummaryResponse>;

  /**
   * Verifica si una Panter existe antes de calificar.
   */
  panterExists(creatorId: string): Promise<boolean>;
}
