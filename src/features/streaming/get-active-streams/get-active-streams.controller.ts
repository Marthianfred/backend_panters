import { Controller, Get } from '@nestjs/common';
import { GetActiveStreamsHandler, ActiveStream } from './get-active-streams.handler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Streaming')
@Controller('api/v1/streaming')
export class GetActiveStreamsController {
  constructor(private readonly handler: GetActiveStreamsHandler) {}

  @Get('active')
  @ApiOperation({ summary: 'Obtener listado de transmisiones activas' })
  @ApiResponse({ 
    status: 200, 
    description: 'Listado de streams en vivo',
    type: Object,
    isArray: true 
  })
  public async getActiveStreams(): Promise<ActiveStream[]> {
    return this.handler.execute();
  }
}
