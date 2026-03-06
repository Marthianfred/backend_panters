import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '@/features/auth/application/auth.service';
import { Request, Response } from 'express';

// We replace the actual better_auth module export with our mock
jest.mock('better-auth', () => {
  return {
    betterAuth: jest.fn().mockImplementation(() => ({
      handler: jest.fn(),
    })),
  };
});

// Mock pg to prevent real DB connections during unit tests
jest.mock('pg', () => {
  return {
    Pool: jest.fn().mockImplementation(() => ({
      connect: jest.fn(),
      query: jest.fn(),
      end: jest.fn(),
    })),
  };
});

describe('AuthService', () => {
  let service: AuthService;
  let configService: ConfigService;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest
              .fn()
              .mockReturnValue('postgres://fake:url@localhost/db'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('debe inicializar betterAuth consultando DATABASE_URL', () => {
      service.onModuleInit();

      expect(configService.getOrThrow).toHaveBeenCalledWith('DATABASE_URL');

      const { betterAuth } = require('better-auth');
      expect(betterAuth).toHaveBeenCalledTimes(1);

      expect(service.instance).toBeDefined();
    });
  });

  describe('handleAuthRequest', () => {
    it('debe arrojar un error si betterAuth no ha sido inicializado', async () => {
      const req = {} as Request;
      const res = {} as Response;

      await expect(service.handleAuthRequest(req, res)).rejects.toThrow(
        'BetterAuth is not initialized.',
      );
    });

    it('debe llamar al handler interno de betterAuth cuando ya está inicializado', async () => {
      const req = { url: '/api/auth/login' } as Request;
      const res = { send: jest.fn() } as unknown as Response;

      // Inicializamos explicitamente para poblar `this.authInstance`
      service.onModuleInit();

      await service.handleAuthRequest(req, res);

      const { betterAuth } = require('better-auth');
      const mockHandler = (betterAuth as jest.Mock).mock.results[0].value
        .handler;

      expect(mockHandler).toHaveBeenCalledWith(req, res);
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });
  });
});
