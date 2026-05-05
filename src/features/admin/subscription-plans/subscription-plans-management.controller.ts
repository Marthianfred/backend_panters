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

import { CreatePlanHandler } from './application/create-plan/create-plan.handler';
import { UpdatePlanHandler } from './application/update-plan/update-plan.handler';
import { ActivatePlanHandler } from './application/activate-plan/activate-plan.handler';
import { DeactivatePlanHandler } from './application/deactivate-plan/deactivate-plan.handler';
import { ListPlansHandler } from './application/list-plans/list-plans.handler';

import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { UpdateSubscriptionPlanDto } from './dto/update-subscription-plan.dto';

@ApiTags('Admin - Subscription Plans')
@ApiBearerAuth()
@Controller('api/v1/admin/subscription-plans')
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class SubscriptionPlansManagementController {
  constructor(
    private readonly createHandler: CreatePlanHandler,
    private readonly updateHandler: UpdatePlanHandler,
    private readonly activateHandler: ActivatePlanHandler,
    private readonly deactivateHandler: DeactivatePlanHandler,
    private readonly listHandler: ListPlansHandler,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo plan de suscripción' })
  async create(@Body() dto: CreateSubscriptionPlanDto) {
    return await this.createHandler.handle(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un plan de suscripción existente' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubscriptionPlanDto,
  ) {
    return await this.updateHandler.handle(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Desactivar un plan de suscripción' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return await this.deactivateHandler.handle(id);
  }

  @Patch(':id/activate')
  @ApiOperation({
    summary: 'Activar un plan de suscripción previamente desactivado',
  })
  async activate(@Param('id', ParseUUIDPipe) id: string) {
    return await this.activateHandler.handle(id);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar todos los planes de suscripción para administración',
  })
  async list() {
    return await this.listHandler.handle();
  }
}
