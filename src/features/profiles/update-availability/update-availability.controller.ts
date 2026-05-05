import {
  Controller,
  Put,
  Get,
  Req,
  Res,
  Body,
  Param,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { UpdateAvailabilityHandler } from './update-availability.handler';
import { AuthGuard } from '../../../features/auth/guards/auth.guard';
import { RolesGuard } from '../../../features/auth/guards/roles.guard';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { Role } from '../../../core/auth/roles.enum';
import type { AuthenticatedRequest } from '../../../features/auth/types/auth.types';

export class UpdateAvailabilityDto {
  isOnline: boolean;
}

@Controller('api/v1/profiles/availability')
@UseGuards(AuthGuard, RolesGuard)
export class UpdateAvailabilityController {
  constructor(private readonly handler: UpdateAvailabilityHandler) {}

  /**
   * Obtiene la disponibilidad del usuario actual (para el switch de la Topbar)
   * Permitimos a todos los roles autenticados acceder para evitar errores 403 en el layout global.
   */
  @Get('me')
  @Roles(Role.MODEL, Role.SUBSCRIBER, Role.ADMIN)
  async getMyAvailability(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const userId = req.user.id;
      const response = await this.handler.get(userId);
      res.status(HttpStatus.OK).json({ data: response });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // Si el usuario no tiene un perfil con disponibilidad (ej. un admin o subscriber nuevo), 
      // devolvemos un estado por defecto en lugar de un error para no romper el front.
      res.status(HttpStatus.OK).json({ data: { userId: req.user.id, isOnline: false } });
    }
  }

  /**
   * Obtiene la disponibilidad de cualquier modelo por su userId (para suscriptores en el perfil)
   */
  @Get(':userId')
  @Roles(Role.MODEL, Role.SUBSCRIBER, Role.ADMIN)
  async getUserAvailability(
    @Param('userId') userId: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const response = await this.handler.get(userId);
      res.status(HttpStatus.OK).json({ data: response });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(HttpStatus.NOT_FOUND).json({ error: message });
    }
  }

  /**
   * Actualiza la disponibilidad (solo modelos)
   */
  @Put()
  @Roles(Role.MODEL, Role.ADMIN)
  async updateAvailability(
    @Req() req: AuthenticatedRequest,
    @Body() body: UpdateAvailabilityDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const userId = req.user.id;
      const response = await this.handler.execute(userId, body.isOnline);
      res.status(HttpStatus.OK).json({ data: response });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(HttpStatus.BAD_REQUEST).json({ error: message });
    }
  }
}
