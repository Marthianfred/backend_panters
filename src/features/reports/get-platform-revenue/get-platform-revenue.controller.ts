import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetPlatformRevenueHandler } from './get-platform-revenue.handler';
import { GetPlatformRevenueQueryDto, PlatformRevenueResponseDto } from './get-platform-revenue.models';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { Role } from '../../../core/auth/roles.enum';

@ApiTags('Reports')
@Controller('api/v1/reports/platform-revenue')
@UseGuards(AuthGuard, RolesGuard)
export class GetPlatformRevenueController {
  constructor(private readonly handler: GetPlatformRevenueHandler) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Obtener reporte de ingresos de la plataforma' })
  @ApiResponse({ status: 200, type: PlatformRevenueResponseDto })
  async getRevenue(
    @Query() query: GetPlatformRevenueQueryDto,
  ): Promise<PlatformRevenueResponseDto> {
    return await this.handler.execute(query);
  }
}
