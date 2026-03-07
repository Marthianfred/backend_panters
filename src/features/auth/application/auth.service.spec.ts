import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '@/features/auth/application/auth.service';
import { Request, Response } from 'express';
import { BETTER_AUTH_TOKEN } from '../infrastructure/better-auth.provider';
import { toNodeHandler } from 'better-auth/node';

// Mock simple de better-auth/node
jest.mock('better-auth/node', () => ({
  toNodeHandler: jest
    .fn()
    .mockImplementation(() => jest.fn().mockResolvedValue(true)),
}));

describe('AuthService', () => {
  let service: AuthService;
  let mockAuthInstance: unknown;

  beforeEach(async () => {
    mockAuthInstance = {}; // Mock simple de la instancia

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: BETTER_AUTH_TOKEN,
          useValue: mockAuthInstance,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('handleAuthRequest', () => {
    it('debe llamar al handler de nodo con la instancia de auth', async () => {
      // Usamos as unknown para romper la cadena de 'any' del linter de Jest
      const mockHandler = (
        toNodeHandler as unknown as jest.Mock<jest.Mock<Promise<boolean>>>
      )();

      const req = { url: '/api/auth/login' } as Request;
      const res = { send: jest.fn() } as unknown as Response;

      await service.handleAuthRequest(req, res);

      expect(toNodeHandler).toHaveBeenCalledWith(mockAuthInstance);
      expect(mockHandler).toHaveBeenCalledWith(req, res);
    });
  });
});
