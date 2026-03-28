import { Test, TestingModule } from '@nestjs/testing';
import { CreateStreamHandler } from './create-stream.handler';
import { STREAM_REPOSITORY } from '../get-viewer-access/interfaces/stream.repository.interface';
import { KINESIS_VIDEO_SERVICE } from '../get-viewer-access/interfaces/kinesis.service.interface';
import { ConfigService } from '@nestjs/config';

describe('CreateStreamHandler', () => {
  let handler: CreateStreamHandler;
  let mockStreamRepository: any;
  let mockKinesisVideoService: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockStreamRepository = {
      createStream: jest.fn().mockResolvedValue(undefined),
    };

    mockKinesisVideoService = {
      createSignalingChannel: jest.fn().mockResolvedValue('arn:aws:kinesisvideo:us-east-2:123456789012:signaling-channel/test-stream'),
      generateProducerCredentials: jest.fn().mockResolvedValue({
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret',
        sessionToken: 'test-token',
        expiration: new Date(),
      }),
    };

    mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        if (key === 'KN_STREAMS_REGION') return 'us-east-2';
        if (key === 'AWS_BUCKET') return 'panters-test';
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateStreamHandler,
        {
          provide: STREAM_REPOSITORY,
          useValue: mockStreamRepository,
        },
        {
          provide: KINESIS_VIDEO_SERVICE,
          useValue: mockKinesisVideoService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    handler = module.get<CreateStreamHandler>(CreateStreamHandler);
  });

  it('debe estar definido', () => {
    expect(handler).toBeDefined();
  });

  it('debe crear un canal de señalización y devolver credenciales de productor', async () => {
    const request = {
      creatorId: 'creator-123',
      title: 'Mi Show en Vivo',
    };

    const result = await handler.execute(request);

    expect(mockKinesisVideoService.createSignalingChannel).toHaveBeenCalled();
    expect(mockKinesisVideoService.generateProducerCredentials).toHaveBeenCalledWith(
      expect.stringContaining('arn:aws:kinesisvideo'),
      'creator-123',
    );
    expect(mockStreamRepository.createStream).toHaveBeenCalled();
    
    expect(result).toHaveProperty('streamId');
    expect(result).toHaveProperty('credentials');
    expect(result.credentials.accessKeyId).toBe('test-key');
    expect(result.region).toBe('us-east-2');
  });
});
