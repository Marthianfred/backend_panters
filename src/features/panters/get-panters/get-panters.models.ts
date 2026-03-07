import { PanterServiceItem } from './interfaces/panters.repository.interface';

// Using Record<string, never> instead of empty interface for strict typing
export type GetPantersRequest = Record<string, never>;

export interface PanterSummary {
  id: string;
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
  isOnline: boolean;
  reviewsCount: number;
  isVip: boolean;
  services: PanterServiceItem[];
}

export interface GetPantersResponse {
  panters: PanterSummary[];
}
