import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetPlatformSummaryHandler } from './get-platform-summary.handler';
import {
  GetPlatformSummaryQueryDto,
  PlatformSummaryResponseDto,
} from './get-platform-summary.models';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { Role } from '../../../core/auth/roles.enum';

@ApiTags('Reports')
@Controller('api/v1/reports/platform-summary')
@UseGuards(AuthGuard, RolesGuard)
export class GetPlatformSummaryController {
  constructor(private readonly handler: GetPlatformSummaryHandler) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary:
      'Obtener resumen general de la plataforma (usuarios, suscripciones, modelos)',
  })
  @ApiResponse({ status: 200, type: PlatformSummaryResponseDto })
  async getSummary(
    @Query() query: GetPlatformSummaryQueryDto,
  ): Promise<PlatformSummaryResponseDto> {
    return await this.handler.execute(query);
  }
}
