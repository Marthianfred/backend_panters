export interface Content {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  type: string;
  price: number;
  createdAt: Date;
  url: string;
  thumbnailUrl?: string;
}

export const CONTENT_REPOSITORY_TOKEN = Symbol('CONTENT_REPOSITORY_TOKEN');

export interface IContentRepository {
  saveContent(content: Content): Promise<Content>;
  listContents(params?: {
    creatorId?: string;
    published?: boolean;
  }): Promise<Content[]>;
  getContentById(id: string): Promise<Content | null>;
  getPurchasedContentIds(userId: string): Promise<string[]>;
}
