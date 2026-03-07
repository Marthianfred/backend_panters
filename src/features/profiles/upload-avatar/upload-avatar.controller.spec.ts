import { Test, TestingModule } from '@nestjs/testing';
import { UploadAvatarController } from './upload-avatar.controller';
import { UploadAvatarHandler } from './upload-avatar.handler';
import { AvatarUploadFailedError } from './upload-avatar.models';
import type { AuthenticatedRequest } from '../../auth/types/auth.types';
import type { Response } from 'express';
import { HttpStatus } from '@nestjs/common';

describe('UploadAvatarController', () => {
  let controller: UploadAvatarController;
  let handler: jest.Mocked<UploadAvatarHandler>;

  beforeEach(async () => {
    const mockHandler = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadAvatarController],
      providers: [
        {
          provide: UploadAvatarHandler,
          useValue: mockHandler,
        },
      ],
    }).compile();

    controller = module.get<UploadAvatarController>(UploadAvatarController);
    handler = module.get(UploadAvatarHandler);
  });

  describe('uploadAvatar', () => {
    const mockUserId = 'user-123';
    const mockReq = {
      user: { id: mockUserId },
    } as AuthenticatedRequest;

    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    const mockFile = {
      buffer: Buffer.from('test-image'),
      originalname: 'avatar.jpg',
      mimetype: 'image/jpeg',
    } as Express.Multer.File;

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return BAD_REQUEST if no file is provided', async () => {
      await controller.uploadAvatar(mockReq, mockRes, undefined as any);

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Archivo de imagen no proporcionado en el payload.',
      });
      expect(handler.execute).not.toHaveBeenCalled();
    });

    it('should call handler and return OK on success', async () => {
      const mockResponseData = { avatarUrl: 'http://s3.com/avatar.jpg' };
      handler.execute.mockResolvedValue(mockResponseData);

      await controller.uploadAvatar(mockReq, mockRes, mockFile);

      expect(handler.execute).toHaveBeenCalledWith({
        userId: mockUserId,
        fileBuffer: mockFile.buffer,
        originalName: mockFile.originalname,
        mimeType: mockFile.mimetype,
      });
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockRes.json).toHaveBeenCalledWith({ data: mockResponseData });
    });

    it('should return BAD_REQUEST if handler throws AvatarUploadFailedError', async () => {
      const error = new AvatarUploadFailedError(mockUserId);
      handler.execute.mockRejectedValue(error);

      await controller.uploadAvatar(mockReq, mockRes, mockFile);

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({ error: error.message });
    });

    it('should return INTERNAL_SERVER_ERROR if handler throws an unknown error', async () => {
      handler.execute.mockRejectedValue(new Error('Unexpected fake error'));

      await controller.uploadAvatar(mockReq, mockRes, mockFile);

      expect(mockRes.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Error interno del servidor al procesar la subida del avatar.',
      });
    });
  });
});
