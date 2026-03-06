import { Injectable } from '@nestjs/common';
import {
  Content,
  IContentRepository,
} from '../interfaces/content.repository.interface';

@Injectable()
export class InMemoryContentRepository implements IContentRepository {
  private contents: Map<string, Content> = new Map();

  public async saveContent(content: Content): Promise<Content> {
    this.contents.set(content.id, content);
    return content;
  }

  public async listContents(params?: {
    creatorId?: string;
  }): Promise<Content[]> {
    const all = Array.from(this.contents.values());
    if (params?.creatorId) {
      return all.filter((c) => c.creatorId === params.creatorId);
    }
    return all;
  }

  public async getContentById(id: string): Promise<Content | null> {
    const content = this.contents.get(id);
    return content || null;
  }
}
