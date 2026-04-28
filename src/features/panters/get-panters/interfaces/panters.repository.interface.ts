export interface PanterServiceItem {
  name: string;
  type: string;
  price?: number;
}

export interface PanterData {
  id: string;
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
  isOnline: boolean;
  reviewsCount: number;
  isVip: boolean;
  services: PanterServiceItem[] | string;
  rating?: number;
}

export const PANTERS_REPOSITORY = 'PANTERS_REPOSITORY';

export interface IPantersRepository {
  getAllPanters(): Promise<PanterData[]>;
  getRanking(limit?: number): Promise<PanterData[]>;
}
