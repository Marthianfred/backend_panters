import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AwsKinesisVideoService } from './aws.kinesis.service';
import { KinesisVideoClient } from '@aws-sdk/client-kinesis-video';


jest.mock('@aws-sdk/client-kinesis-video');

describe('AwsKinesisVideoService', () => {
  let service: AwsKinesisVideoService;
  let mockConfigService: any;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        if (key === 'KN_STREAMS_REGION') return 'us-east-2';
        if (key === 'KN_STREAMS_ACCESS_KEY_ID') return 'fake-access-key';
        if (key === 'KN_STREAMS_SECRET_ACCESS_KEY') return 'fake-secret-key';
        return defaultValue;
      }),
      getOrThrow: jest.fn((key: string) => {
        if (key === 'KN_STREAMS_ACCESS_KEY_ID') return 'fake-access-key';
        if (key === 'KN_STREAMS_SECRET_ACCESS_KEY') return 'fake-secret-key';
        return '';
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AwsKinesisVideoService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AwsKinesisVideoService>(AwsKinesisVideoService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe generar credenciales de productor', async () => {
    const creds = await service.generateProducerCredentials('arn:test', 'user-123');
    expect(creds).toHaveProperty('accessKeyId');
    expect(creds.accessKeyId).toBe('fake-access-key');
  });

  it('debe llamar a createSignalingChannel de AWS SDK', async () => {
    const mockSend = jest.fn().mockResolvedValue({ ChannelARN: 'arn:from-aws' });
    (service as any).kvsClient.send = mockSend;

    const arn = await service.createSignalingChannel('MiCanal');
    
    expect(mockSend).toHaveBeenCalled();
    expect(arn).toBe('arn:from-aws');
  });
});
