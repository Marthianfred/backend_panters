import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, HttpStatus, HttpCode } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { Role } from '../../../core/auth/roles.enum';
import { CreatePlanHandler } from './create-plan.handler';
import { ListPlansHandler } from './list-plans.handler';
import { GetPlanHandler } from './get-plan.handler';
import { UpdatePlanHandler } from './update-plan.handler';
import { DeletePlanHandler } from './delete-plan.handler';
import { CreatePlanDto, UpdatePlanDto, SubscriptionPlanDto } from '../plans.models';

@ApiTags('Subscription Plans (Admin & Public)')
@Controller('api/v1/subscriptions/plans')
export class PlansController {
  constructor(
    private readonly createHandler: CreatePlanHandler,
    private readonly listHandler: ListPlansHandler,
    private readonly getHandler: GetPlanHandler,
    private readonly updateHandler: UpdatePlanHandler,
    private readonly deleteHandler: DeletePlanHandler,
  ) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un nuevo plan de suscripción (Solo Admins)' })
  @ApiResponse({ status: 201, type: SubscriptionPlanDto })
  async create(@Body() dto: CreatePlanDto): Promise<SubscriptionPlanDto> {
    return await this.createHandler.execute(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los planes de suscripción activos' })
  @ApiResponse({ status: 200, type: [SubscriptionPlanDto] })
  async findAll(): Promise<SubscriptionPlanDto[]> {
    return await this.listHandler.execute();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de un plan por ID' })
  @ApiResponse({ status: 200, type: SubscriptionPlanDto })
  @ApiResponse({ status: 404, description: 'Plan no encontrado' })
  async findOne(@Param('id') id: string): Promise<SubscriptionPlanDto> {
    return await this.getHandler.execute(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar parcialmente un plan (Solo Admins)' })
  @ApiResponse({ status: 200, type: SubscriptionPlanDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
  ): Promise<SubscriptionPlanDto> {
    return await this.updateHandler.execute(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desactivar un plan de suscripción (Solo Admins)' })
  @ApiResponse({ status: 204, description: 'Plan desactivado correctamente' })
  async remove(@Param('id') id: string): Promise<void> {
    return await this.deleteHandler.execute(id);
  }
}
