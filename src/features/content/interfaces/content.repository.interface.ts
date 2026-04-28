export interface Content {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  type: string;
  price: number;
  accessType: string; 
  createdAt: Date;
  url: string;
  thumbnailUrl?: string;
  creatorDetails?: {
    fullName: string;
    avatarUrl: string;
    isOnline: boolean;
  };
  panterasCount?: number;
  hasReacted?: boolean;
}

export const CONTENT_REPOSITORY_TOKEN = Symbol('CONTENT_REPOSITORY_TOKEN');

export interface IContentRepository {
  saveContent(content: Content): Promise<Content>;
  listContents(params?: {
    creatorId?: string;
    published?: boolean;
    subscriberId?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<Content[]>;
  countContents(params?: {
    creatorId?: string;
    published?: boolean;
    type?: string;
  }): Promise<number>;
  getContentById(id: string): Promise<Content | null>;
  getPurchasedContentIds(userId: string): Promise<string[]>;
  updateContent(id: string, updates: Partial<Content>): Promise<void>;
  deleteContent(id: string): Promise<void>;
}
