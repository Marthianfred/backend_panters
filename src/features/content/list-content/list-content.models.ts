export interface ListContentRequest {
  creatorId?: string;
  isSubscriber: boolean;
  subscriberId?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export interface ListContentResponse {
  creator?: {
    fullName: string;
    avatarUrl: string;
    isOnline: boolean;
  };
  contents: ContentItemDTO[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ContentItemDTO {
  id: string;
  title: string;
  description: string;
  type: string;
  price: number;
  accessType: string;
  creatorId: string;
  createdAt: Date;
  thumbnailUrl: string;
  isBought?: boolean;
  panterasCount: number;
  hasReacted: boolean;
}
