import { Test, TestingModule } from '@nestjs/testing';
import { GetViewerAccessHandler } from './get-viewer-access.handler';
import { STREAM_REPOSITORY } from './interfaces/stream.repository.interface';
import { KINESIS_VIDEO_SERVICE } from './interfaces/kinesis.service.interface';
import { S3_SERVICE } from './interfaces/s3.service.interface';
import { StreamNotFoundError } from './get-viewer-access.models';

describe('GetViewerAccessHandler', () => {
  let handler: GetViewerAccessHandler;
  const mockStreamRepository = {
    getStreamMetadataById: jest.fn(),
  };
  const mockKinesisVideoService = {
    generateViewerCredentials: jest.fn(),
  };
  const mockS3Service = {
    getPresignedThumbnailUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetViewerAccessHandler,
        { provide: STREAM_REPOSITORY, useValue: mockStreamRepository },
        { provide: KINESIS_VIDEO_SERVICE, useValue: mockKinesisVideoService },
        { provide: S3_SERVICE, useValue: mockS3Service },
      ],
    }).compile();

    handler = module.get<GetViewerAccessHandler>(GetViewerAccessHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe arrojar StreamNotFoundError si el stream no existe', async () => {
    mockStreamRepository.getStreamMetadataById.mockResolvedValueOnce(null);

    await expect(
      handler.execute({ streamId: 'invalid_id', userId: 'user1' }),
    ).rejects.toThrow(StreamNotFoundError);

    expect(mockStreamRepository.getStreamMetadataById).toHaveBeenCalledWith(
      'invalid_id',
    );
  });

  it('debe devolver la respuesta completa si todos los componentes resuelven exitosamente', async () => {
    const fakeMetadata = {
      channelArn: 'arn:aws:kinesisvideo:us-west-2:1234:channel/Chan/123',
      region: 'us-west-2',
      s3ThumbnailBucket: 'bucket-name',
      s3ThumbnailKey: 'thumb.jpg',
    };

    const fakeCredentials = {
      accessKeyId: 'AKIA...',
      secretAccessKey: 'SECRET...',
      sessionToken: 'TOKEN...',
      expiration: new Date(),
    };

    const fakeUrl = 'https://fake-s3-url.com';

    mockStreamRepository.getStreamMetadataById.mockResolvedValueOnce(
      fakeMetadata,
    );
    mockKinesisVideoService.generateViewerCredentials.mockResolvedValueOnce(
      fakeCredentials,
    );
    mockS3Service.getPresignedThumbnailUrl.mockResolvedValueOnce(fakeUrl);

    const result = await handler.execute({
      streamId: 'valid_id',
      userId: 'user1',
    });

    expect(result).toEqual({
      channelArn: fakeMetadata.channelArn,
      region: fakeMetadata.region,
      thumbnailUrl: fakeUrl,
      credentials: fakeCredentials,
    });
    expect(mockS3Service.getPresignedThumbnailUrl).toHaveBeenCalledWith(
      'bucket-name',
      'thumb.jpg',
    );
    expect(
      mockKinesisVideoService.generateViewerCredentials,
    ).toHaveBeenCalledWith(fakeMetadata.channelArn, 'user1');
  });
});
