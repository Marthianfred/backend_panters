import { Test, TestingModule } from '@nestjs/testing';
import { ListContentHandler } from './list-content.handler';
import { CONTENT_REPOSITORY_TOKEN } from '../interfaces/content.repository.interface';
import { CONTENT_STORAGE_SERVICE } from '../upload-content/interfaces/content-storage.service.interface';

describe('ListContentHandler', () => {
  let handler: ListContentHandler;
  let repository: any;
  let storage: any;

  beforeEach(async () => {
    repository = {
      listContents: jest.fn(),
      countContents: jest.fn(),
      getPurchasedContentIds: jest.fn(),
    };
    storage = {
      getPresignedDownloadUrl: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListContentHandler,
        { provide: CONTENT_REPOSITORY_TOKEN, useValue: repository },
        { provide: CONTENT_STORAGE_SERVICE, useValue: storage },
      ],
    }).compile();

    handler = module.get<ListContentHandler>(ListContentHandler);
  });

  describe('execute', () => {
    it('debe listar todo el contenido cuando no se proporciona creatorId (Discovery mode)', async () => {
      const mockResult = [
        {
          id: '1',
          creatorId: 'c1',
          title: 'Content 1',
          type: 'photo',
          price: 10,
          accessType: 'free',
          url: 'url1',
          thumbnailUrl: 'thumb1',
          creatorDetails: { fullName: 'Creator 1', avatarUrl: 'avatar1', isOnline: true },
        },
        {
          id: '2',
          creatorId: 'c2',
          title: 'Content 2',
          type: 'photo',
          price: 20,
          accessType: 'premium',
          url: 'url2',
          thumbnailUrl: 'thumb2',
          creatorDetails: { fullName: 'Creator 2', avatarUrl: 'avatar2', isOnline: false },
        },
      ];

      repository.listContents.mockResolvedValue(mockResult);
      repository.countContents.mockResolvedValue(2);
      repository.getPurchasedContentIds.mockResolvedValue([]);
      storage.getPresignedDownloadUrl.mockResolvedValue('http://signed-url');

      const result = await handler.execute({
        isSubscriber: true,
        subscriberId: 'u1',
        page: 1,
        limit: 10,
      });

      expect(repository.listContents).toHaveBeenCalledWith({
        creatorId: undefined,
        subscriberId: 'u1',
        published: true,
        type: undefined,
        page: 1,
        limit: 10,
      });
      expect(result.contents).toHaveLength(2);
      expect(result.pagination).toEqual({ page: 1, limit: 10, total: 2, totalPages: 1 });
      expect(result.creator).toBeUndefined(); 
    });

    it('debe filtrar por tipo de contenido si se especifica', async () => {
        repository.listContents.mockResolvedValue([]);
        repository.countContents.mockResolvedValue(0);
        repository.getPurchasedContentIds.mockResolvedValue([]);
  
        await handler.execute({
          isSubscriber: true,
          type: 'video',
        });
  
        expect(repository.listContents).toHaveBeenCalledWith({
          creatorId: undefined,
          subscriberId: undefined,
          published: true,
          type: 'video',
          page: 1,
          limit: 20,
        });
      });

    it('debe incluir información del creador cuando se filtra por creatorId (Muro mode)', async () => {
      const mockResult = [
        {
          id: '1',
          creatorId: 'c1',
          title: 'Content 1',
          type: 'photo',
          price: 10,
          accessType: 'free',
          url: 'url1',
          thumbnailUrl: 'thumb1',
          creatorDetails: { fullName: 'Creator 1', avatarUrl: 'avatar1', isOnline: true },
        },
      ];

      repository.listContents.mockResolvedValue(mockResult);
      repository.getPurchasedContentIds.mockResolvedValue([]);
      storage.getPresignedDownloadUrl.mockResolvedValue('http://signed-url');

      const result = await handler.execute({
        creatorId: 'c1',
        isSubscriber: true,
        subscriberId: 'u1',
      });

      expect(result.creator).toBeDefined();
      expect(result.creator?.fullName).toBe('Creator 1');
      expect(result.contents).toHaveLength(1);
    });
  });
});
