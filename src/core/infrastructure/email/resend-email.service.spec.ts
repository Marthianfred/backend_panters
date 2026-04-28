import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ResendEmailService } from './resend-email.service';
import { Resend } from 'resend';

jest.mock('resend');

describe('ResendEmailService', () => {
  let service: ResendEmailService;
  let configService: ConfigService;
  let resendMock: jest.Mocked<Resend>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResendEmailService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('test-api-key'),
            get: jest
              .fn()
              .mockReturnValue('Panters <noreply@pantersdigital.com>'),
          },
        },
      ],
    }).compile();

    service = module.get<ResendEmailService>(ResendEmailService);
    configService = module.get<ConfigService>(ConfigService);

    resendMock = {
      emails: {
        send: jest.fn(),
      },
    } as any;
    (service as any).resend = resendMock;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send an email successfully', async () => {
    const sendOptions = {
      to: 'test@example.com',
      subject: 'Test Subject',
      html: '<p>Test Content</p>',
    };

    resendMock.emails.send = jest.fn().mockResolvedValue({
      data: { id: 'test-id' },
      error: null,
    });

    const result = await service.send(sendOptions);

    expect(resendMock.emails.send).toHaveBeenCalledWith({
      from: 'Panters <noreply@pantersdigital.com>',
      to: sendOptions.to,
      subject: sendOptions.subject,
      html: sendOptions.html,
      text: undefined,
    });
    expect(result.data).toEqual({ id: 'test-id' });
    expect(result.error).toBeNull();
  });

  it('should handle errors when sending an email', async () => {
    const sendOptions = {
      to: 'test@example.com',
      subject: 'Test Subject',
      html: '<p>Test Content</p>',
    };

    const mockError = { message: 'Error sending email', name: 'ResendError' };
    resendMock.emails.send = jest.fn().mockResolvedValue({
      data: null,
      error: mockError,
    });

    const result = await service.send(sendOptions);

    expect(result.data).toBeNull();
    expect(result.error).toEqual(mockError);
  });
});
