import { Test, TestingModule } from '@nestjs/testing';
import { GetViewerAccessController } from './get-viewer-access.controller';
import { GetViewerAccessHandler } from './get-viewer-access.handler';
import { Request, Response } from 'express';
import { StreamNotFoundError } from './get-viewer-access.models';

describe('GetViewerAccessController', () => {
  let controller: GetViewerAccessController;
  let mockHandler = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GetViewerAccessController],
      providers: [{ provide: GetViewerAccessHandler, useValue: mockHandler }],
    }).compile();

    controller = module.get<GetViewerAccessController>(
      GetViewerAccessController,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe devolver error 400 si falta el streamId', async () => {
    const req = { user: { id: 'user1' } } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await controller.getAccess('', req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Faltan parámetros requeridos: streamId.',
    });
  });

  it('debe devolver error 404 si el stream no existe', async () => {
    mockHandler.execute.mockRejectedValue(new StreamNotFoundError('123'));

    const req = { user: { id: 'user1' } } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await controller.getAccess('123', req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('debe devolver 200 con las credenciales y la URL', async () => {
    const successResponse = {
      channelArn: 'arn',
      region: 'us-east-1',
      thumbnailUrl: 'url',
      credentials: {},
    };

    mockHandler.execute.mockResolvedValue(successResponse);

    const req = { user: { id: 'user1' } } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    await controller.getAccess('123', req, res);

    expect(mockHandler.execute).toHaveBeenCalledWith({
      streamId: '123',
      userId: 'user1',
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(successResponse);
  });
});
