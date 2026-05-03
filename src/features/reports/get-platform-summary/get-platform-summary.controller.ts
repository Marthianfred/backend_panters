import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetPlatformSummaryHandler } from './get-platform-summary.handler';
import { GetPlatformSummaryQueryDto, PlatformSummaryResponseDto } from './get-platform-summary.models';

@ApiTags('Reports')
@Controller('api/v1/reports/platform-summary')
export class GetPlatformSummaryController {
  constructor(private readonly handler: GetPlatformSummaryHandler) {}

  @Get()
  @ApiOperation({ summary: 'Obtener resumen general de la plataforma (usuarios, suscripciones, modelos)' })
  @ApiResponse({ status: 200, type: PlatformSummaryResponseDto })
  async getSummary(
    @Query() query: GetPlatformSummaryQueryDto,
  ): Promise<PlatformSummaryResponseDto> {
    return await this.handler.execute(query);
  }
}
