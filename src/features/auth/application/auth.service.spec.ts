import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '@/features/auth/application/auth.service';
import { Request, Response } from 'express';
import { BETTER_AUTH_TOKEN } from '../infrastructure/auth.constants';
import { toNodeHandler } from 'better-auth/node';

// El mock de better-auth/node se maneja globalmente en src/__mocks__/better-auth-node.ts vía package.json moduleNameMapper
import { mockHandler } from 'better-auth/node';

describe('AuthService', () => {
  let service: AuthService;
  let mockAuthInstance: Record<string, unknown>;

  beforeEach(async () => {
    mockAuthInstance = {};

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
      const req = { url: '/api/auth/login' } as Request;
      const res = { send: jest.fn() } as unknown as Response;

      await service.handleAuthRequest(req, res);

      expect(toNodeHandler).toHaveBeenCalledWith(mockAuthInstance);
      expect(mockHandler).toHaveBeenCalledWith(req, res);
    });
  });
});
