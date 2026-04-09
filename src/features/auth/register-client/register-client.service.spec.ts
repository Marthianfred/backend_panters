import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { RegisterClientService } from './register-client.service';
import { BETTER_AUTH_TOKEN } from '../infrastructure/auth.constants';

describe('RegisterClientService', () => {
  let service: RegisterClientService;
  let mockAuthInstance: any;

  beforeEach(async () => {
    mockAuthInstance = {
      api: {
        signUpEmail: jest.fn(),
        verifyEmail: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterClientService,
        {
          provide: BETTER_AUTH_TOKEN,
          useValue: mockAuthInstance,
        },
      ],
    }).compile();

    service = module.get<RegisterClientService>(RegisterClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a user successfully', async () => {
      const dto = { 
        email: 'test@example.com', 
        password: 'password123', 
        name: 'Test User',
        username: 'testuser',
        birthDate: '1990-01-01',
        gender: 'male',
        age: 30
      };
      mockAuthInstance.api.signUpEmail.mockResolvedValue({
        user: { id: '123', email: 'test@example.com', name: 'Test User', username: 'testuser' },
      });

      const result = await service.register(dto);

      expect(result.success).toBe(true);
      expect(result.user?.id).toBe('123');
      expect(mockAuthInstance.api.signUpEmail).toHaveBeenCalledWith({
        body: { 
          email: dto.email, 
          password: dto.password, 
          name: dto.name,
          username: dto.username,
          birthDate: dto.birthDate,
          gender: dto.gender,
          age: dto.age
        },
      });
    });

    it('should throw BadRequestException if user already exists', async () => {
      const dto = { 
        email: 'test@example.com', 
        password: 'password123', 
        name: 'Test User',
        username: 'testuser',
        birthDate: '1990-01-01',
        gender: 'male',
        age: 30
      };
      mockAuthInstance.api.signUpEmail.mockRejectedValue({ status: 400, code: 'USER_ALREADY_EXISTS' });

      await expect(service.register(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('verify', () => {
    it('should verify email successfully', async () => {
      const dto = { token: 'valid-token' };
      mockAuthInstance.api.verifyEmail.mockResolvedValue({ status: true });

      const result = await service.verify(dto);

      expect(result.success).toBe(true);
      expect(mockAuthInstance.api.verifyEmail).toHaveBeenCalledWith({
        query: { token: 'valid-token' },
      });
    });

    it('should throw BadRequestException if token is invalid', async () => {
      const dto = { token: 'invalid-token' };
      mockAuthInstance.api.verifyEmail.mockResolvedValue(null);

      await expect(service.verify(dto)).rejects.toThrow(BadRequestException);
    });
  });
});
