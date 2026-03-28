import { Injectable, Inject } from '@nestjs/common';
import type { IStreamRepository } from '../get-viewer-access/interfaces/stream.repository.interface';
import { STREAM_REPOSITORY } from '../get-viewer-access/interfaces/stream.repository.interface';

@Injectable()
export class StopStreamHandler {
  constructor(
    @Inject(STREAM_REPOSITORY)
    private readonly streamRepository: IStreamRepository,
  ) {}

  public async execute(streamId: string): Promise<void> {
    await this.streamRepository.deactivateStream(streamId);
  }
}
