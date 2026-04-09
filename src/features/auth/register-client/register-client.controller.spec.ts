import { Test, TestingModule } from '@nestjs/testing';
import { RegisterClientController } from './register-client.controller';
import { RegisterClientService } from './register-client.service';
import { RegisterClientRequest, VerifyEmailRequest } from './register-client.models';

describe('RegisterClientController', () => {
  let controller: RegisterClientController;
  let service: RegisterClientService;

  beforeEach(async () => {
    const mockService = {
      register: jest.fn(),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegisterClientController],
      providers: [
        {
          provide: RegisterClientService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<RegisterClientController>(RegisterClientController);
    service = module.get<RegisterClientService>(RegisterClientService);
  });

  it('should call register service', async () => {
    const dto: RegisterClientRequest = { 
      email: 'test@example.com', 
      password: 'password123', 
      name: 'Test',
      username: 'testuser',
      birthDate: '1990-01-01',
      gender: 'male',
      age: 30
    };
    await controller.register(dto);
    expect(service.register).toHaveBeenCalledWith(dto);
  });

  it('should call verify service', async () => {
    const dto: VerifyEmailRequest = { token: 'token123' };
    await controller.verify(dto);
    expect(service.verify).toHaveBeenCalledWith(dto);
  });
});
