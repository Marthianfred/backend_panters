import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { StopStreamHandler } from './stop-stream.handler';

@Controller('api/v1/streaming')
export class StopStreamController {
  constructor(private readonly stopStreamHandler: StopStreamHandler) {}

  @Post('stop')
  @HttpCode(HttpStatus.OK)
  public async stopStream(@Body() body: { streamId: string }): Promise<{ success: boolean }> {
    await this.stopStreamHandler.execute(body.streamId);
    return { success: true };
  }
}
