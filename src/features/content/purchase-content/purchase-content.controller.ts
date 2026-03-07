import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpStatus,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { PurchaseContentHandler } from './purchase-content.handler';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { Role } from '../../../core/auth/roles.enum';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { AuthGuard } from '../../auth/guards/auth.guard';
import {
  ContentNotFoundError,
  InsufficientCoinsError,
} from './purchase-content.models';

@Controller('api/v1/content')
@UseGuards(AuthGuard, RolesGuard) // El orden importa, AuthGuard carga el usuario
export class PurchaseContentController {
  constructor(private readonly handler: PurchaseContentHandler) {}

  @Post('purchase')
  @Roles(Role.SUBSCRIBER)
  public async purchase(
    @Req() req: Request,
    @Body() body: { contentId: string },
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Tomamos el usuario real inyectado por el guard
      const subscriberId = (req as any).user?.id;

      if (!subscriberId) {
        res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ error: 'Usuario no autenticado.' });
        return;
      }

      const response = await this.handler.execute({
        subscriberId: subscriberId,
        contentId: body.contentId,
      });

      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      if (error instanceof ContentNotFoundError) {
        res.status(HttpStatus.NOT_FOUND).json({ error: error.message });
        return;
      }
      if (error instanceof InsufficientCoinsError) {
        res.status(HttpStatus.PAYMENT_REQUIRED).json({ error: error.message });
        return;
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Error procesando la compra.',
      });
    }
  }
}
