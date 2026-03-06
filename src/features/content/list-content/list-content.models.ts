export interface ListContentRequest {
  creatorId?: string;
  isSubscriber: boolean;
}

export interface ListContentResponse {
  contents: ContentItemDTO[];
}

export interface ContentItemDTO {
  id: string;
  title: string;
  description: string;
  price: number;
  creatorId: string;
  createdAt: Date;
}
