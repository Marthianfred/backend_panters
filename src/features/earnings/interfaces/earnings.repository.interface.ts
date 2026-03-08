import { EarningsSummaryResponse } from '../get-earnings-summary/get-earnings-summary.models';
import { EarningsHistoryRequest, EarningsHistoryResponse } from '../get-earnings-history/get-earnings-history.models';

export const EARNINGS_REPOSITORY_TOKEN = Symbol('IEarningsRepository');

export interface IEarningsRepository {
  getCreatorEarningsSummary(
    creatorId: string,
  ): Promise<EarningsSummaryResponse>;

  getCreatorEarningsHistory(
    request: EarningsHistoryRequest,
  ): Promise<EarningsHistoryResponse>;
}
