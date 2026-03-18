import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ReactToPostHandler } from './post-reactions.handler';
import { POST_REACTION_REPOSITORY_TOKEN } from './interfaces/post-reactions.repository.interface';
import { POST_REACTION_EVENT_PUBLISHER_TOKEN } from './interfaces/post-reactions-event-publisher.interface';

describe('ReactToPostHandler', () => {
  let handler: ReactToPostHandler;
  let repository: any;
  let publisher: any;

  beforeEach(async () => {
    repository = {
      postExists: jest.fn(),
      getPostOwnerId: jest.fn(),
      upsertReaction: jest.fn(),
    };

    publisher = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReactToPostHandler,
        { provide: POST_REACTION_REPOSITORY_TOKEN, useValue: repository },
        { provide: POST_REACTION_EVENT_PUBLISHER_TOKEN, useValue: publisher },
      ],
    }).compile();

    handler = module.get<ReactToPostHandler>(ReactToPostHandler);
  });

  it('debe registrar la pantera y notificar al sistema de rating asíncronamente', async () => {
    const userId = 'user-sub-1';
    const dto = { postId: 'post-uuid-1' };
    const creatorId = 'panter-id-1';

    repository.postExists.mockResolvedValue(true);
    repository.getPostOwnerId.mockResolvedValue(creatorId);
    repository.upsertReaction.mockResolvedValue(99); // 99 panteras previas + 1

    const result = await handler.execute(userId, dto);

    expect(result.success).toBe(true);
    expect(result.totalPanteras).toBe(99);
    expect(repository.upsertReaction).toHaveBeenCalledWith(userId, dto.postId);
    expect(publisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        postId: dto.postId,
        creatorId,
        type: 'pantera',
      })
    );
  });

  it('debe fallar si el post no existe en el muro', async () => {
    repository.postExists.mockResolvedValue(false);

    await expect(handler.execute('sub-id', { postId: 'wrong-id' }))
      .rejects.toThrow(NotFoundException);
  });

  it('debe fallar si no se encuentra la dueña del post', async () => {
    repository.postExists.mockResolvedValue(true);
    repository.getPostOwnerId.mockResolvedValue(null);

    await expect(handler.execute('sub-id', { postId: 'post-id' }))
      .rejects.toThrow(NotFoundException);
  });
});
