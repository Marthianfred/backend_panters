import { Test, TestingModule } from '@nestjs/testing';
jest.mock('better-auth', () => ({
  betterAuth: jest.fn().mockImplementation(() => ({
    handler: jest.fn(),
  })),
}));
import { AuthController } from '@/features/auth/api/auth.controller';
import { AuthService } from '@/features/auth/application/auth.service';
import { Request, Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            handleAuthRequest: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('handleAuth', () => {
    it('debe llamar al AuthService.handleAuthRequest con la petición y respuesta de Express', async () => {
      const mockReq = {
        url: '/api/auth/session',
        method: 'GET',
      } as unknown as Request;

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as Response;

      await controller.handleAuth(mockReq, mockRes);

      const handleAuthRequestMock = authService.handleAuthRequest as jest.Mock;
      expect(handleAuthRequestMock).toHaveBeenCalledWith(mockReq, mockRes);
      expect(handleAuthRequestMock).toHaveBeenCalledTimes(1);
    });
  });
});
