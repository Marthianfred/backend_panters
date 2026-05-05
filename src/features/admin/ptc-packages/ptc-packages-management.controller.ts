import {
  Controller,
  Post,
  Patch,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '@/core/auth/roles.enum';

import { CreatePtcPackageHandler } from './application/create-ptc-package/create-ptc-package.handler';
import { UpdatePtcPackageHandler } from './application/update-ptc-package/update-ptc-package.handler';
import { DeactivatePtcPackageHandler } from './application/deactivate-ptc-package/deactivate-ptc-package.handler';
import { ActivatePtcPackageHandler } from './application/activate-ptc-package/activate-ptc-package.handler';
import { ListPtcPackagesHandler } from './application/list-ptc-packages/list-ptc-packages.handler';

import { CreatePtcPackageDto } from './dto/create-ptc-package.dto';
import { UpdatePtcPackageDto } from './dto/update-ptc-package.dto';

@ApiTags('Admin - PTC Packages')
@ApiBearerAuth()
@Controller('api/v1/admin/ptc-packages')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class PtcPackagesManagementController {
  constructor(
    private readonly createHandler: CreatePtcPackageHandler,
    private readonly updateHandler: UpdatePtcPackageHandler,
    private readonly deactivateHandler: DeactivatePtcPackageHandler,
    private readonly activateHandler: ActivatePtcPackageHandler,
    private readonly listHandler: ListPtcPackagesHandler,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo paquete de PTC' })
  async create(@Body() dto: CreatePtcPackageDto) {
    return await this.createHandler.handle(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un paquete de PTC existente' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePtcPackageDto,
  ) {
    return await this.updateHandler.handle(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar un paquete de PTC (Soft Delete)' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return await this.deactivateHandler.handle(id);
  }

  @Patch(':id/activate')
  @ApiOperation({
    summary: 'Activar un paquete de PTC previamente desactivado',
  })
  async activate(@Param('id', ParseUUIDPipe) id: string) {
    return await this.activateHandler.handle(id);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos los paquetes de PTC para administración',
  })
  async list() {
    return await this.listHandler.handle();
  }
}
