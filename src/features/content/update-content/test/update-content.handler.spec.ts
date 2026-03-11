import { UpdateContentHandler } from '../update-content.handler';
import {
  UpdateContentRequest,
  ContentNotFoundError,
  UnauthorizedUpdateError,
} from '../update-content.models';
import type { IContentRepository } from '../../interfaces/content.repository.interface';

describe('UpdateContentHandler', () => {
  let handler: UpdateContentHandler;
  let mockRepository: jest.Mocked<IContentRepository>;

  beforeEach(() => {
    mockRepository = {
      getContentById: jest.fn(),
      updateContent: jest.fn(),
      saveContent: jest.fn(),
      listContents: jest.fn(),
      getPurchasedContentIds: jest.fn(),
      deleteContent: jest.fn(),
    };

    handler = new UpdateContentHandler(mockRepository);
  });

  it('debería actualizar los metadatos exitosamente si es la propietaria', async () => {
    const creatorId = 'c_123';
    const contentId = 'post_1';
    const mockContent = { id: contentId, creatorId, title: 'Old', description: 'Old', type: 'photo', price: 1, createdAt: new Date(), url: '...' };

    mockRepository.getContentById.mockResolvedValue(mockContent);

    const updates = { title: 'New Title', price: 50 };
    const request = new UpdateContentRequest(contentId, creatorId, updates);
    const response = await handler.execute(request);

    expect(response.success).toBe(true);
    expect(mockRepository.updateContent).toHaveBeenCalledWith(contentId, updates);
  });

  it('debería lanzar ContentNotFoundError si el post no existe para actualizar', async () => {
    mockRepository.getContentById.mockResolvedValue(null);

    const request = new UpdateContentRequest('invalid', 'any', { title: '...' });

    await expect(handler.execute(request)).rejects.toThrow(ContentNotFoundError);
  });

  it('debería lanzar UnauthorizedUpdateError si no es la propietaria', async () => {
    const mockContent = { id: 'p1', creatorId: 'owner', title: 'Old', description: 'Old', type: 'photo', price: 1, createdAt: new Date(), url: '...' };
    mockRepository.getContentById.mockResolvedValue(mockContent);

    const request = new UpdateContentRequest('p1', 'intruder', { title: '...' });

    await expect(handler.execute(request)).rejects.toThrow(UnauthorizedUpdateError);
  });
});
