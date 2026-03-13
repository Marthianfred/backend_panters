export interface ListContentRequest {
  creatorId: string;
  isSubscriber: boolean;
  subscriberId?: string;
}

export interface ListContentResponse {
  creator?: {
    fullName: string;
    avatarUrl: string;
    isOnline: boolean;
  };
  contents: ContentItemDTO[];
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
}
