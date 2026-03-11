import { DeleteContentHandler } from '../delete-content.handler';
import {
  DeleteContentRequest,
  ContentNotFoundError,
  UnauthorizedDeleteError,
} from '../delete-content.models';
import type { IContentRepository } from '../../interfaces/content.repository.interface';
import type { IContentStorageService } from '../../upload-content/interfaces/content-storage.service.interface';

describe('DeleteContentHandler', () => {
  let handler: DeleteContentHandler;
  let mockRepository: jest.Mocked<IContentRepository>;
  let mockStorage: jest.Mocked<IContentStorageService>;

  beforeEach(() => {
    mockRepository = {
      getContentById: jest.fn(),
      deleteContent: jest.fn(),
      saveContent: jest.fn(),
      listContents: jest.fn(),
      getPurchasedContentIds: jest.fn(),
      updateContent: jest.fn(),
    };

    mockStorage = {
      deleteContent: jest.fn(),
      getPresignedUploadUrl: jest.fn(),
      getPresignedDownloadUrl: jest.fn(),
    };

    handler = new DeleteContentHandler(mockRepository, mockStorage);
  });

  it('debería eliminar contenido exitosamente si es la propietaria', async () => {
    const creatorId = 'creator_123';
    const contentId = 'content_456';
    const mockContent = {
      id: contentId,
      creatorId: creatorId,
      title: 'Post',
      description: 'Desc',
      type: 'photo',
      price: 10,
      createdAt: new Date(),
      url: 's3://path',
    };

    mockRepository.getContentById.mockResolvedValue(mockContent);

    const request = new DeleteContentRequest(contentId, creatorId);
    const response = await handler.execute(request);

    expect(response.success).toBe(true);
    expect(mockStorage.deleteContent).toHaveBeenCalledWith(
      creatorId,
      contentId,
    );
    expect(mockRepository.deleteContent).toHaveBeenCalledWith(contentId);
  });

  it('debería lanzar ContentNotFoundError si el post no existe', async () => {
    mockRepository.getContentById.mockResolvedValue(null);

    const request = new DeleteContentRequest('invalid', 'any');

    await expect(handler.execute(request)).rejects.toThrow(ContentNotFoundError);
  });

  it('debería lanzar UnauthorizedDeleteError si otra persona intenta borrarlo', async () => {
    const mockContent = {
      id: 'c1',
      creatorId: 'original_creator',
      title: 'Post',
      description: 'Desc',
      type: 'photo',
      price: 10,
      createdAt: new Date(),
      url: 's3://path',
    };

    mockRepository.getContentById.mockResolvedValue(mockContent);

    const request = new DeleteContentRequest('c1', 'intruder_id');

    await expect(handler.execute(request)).rejects.toThrow(
      UnauthorizedDeleteError,
    );
  });
});
