import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetPlatformRevenueHandler } from './get-platform-revenue.handler';
import { GetPlatformRevenueQueryDto, PlatformRevenueResponseDto } from './get-platform-revenue.models';

@ApiTags('Reports')
@Controller('api/v1/reports/platform-revenue')
export class GetPlatformRevenueController {
  constructor(private readonly handler: GetPlatformRevenueHandler) {}

  @Get()
  @ApiOperation({ summary: 'Obtener reporte de ingresos de la plataforma' })
  @ApiResponse({ status: 200, type: PlatformRevenueResponseDto })
  async getRevenue(
    @Query() query: GetPlatformRevenueQueryDto,
  ): Promise<PlatformRevenueResponseDto> {
    return await this.handler.execute(query);
  }
}
