import {
  Controller,
  Get,
  Req,
  Res,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { GetBalanceHandler } from './get-balance.handler';
import { WalletNotFoundError } from './get-balance.models';
import { AuthGuard } from '../../auth/guards/auth.guard';
import type { AuthenticatedRequest } from '../../auth/types/auth.types';

@Controller('api/v1/wallet')
@UseGuards(AuthGuard)
export class GetBalanceController {
  constructor(private readonly handler: GetBalanceHandler) {}

  @Get('balance')
  async getBalance(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const userId = req.user.id;

      if (!userId) {
        res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ error: 'Usuario no autenticado.' });
        return;
      }

      const response = await this.handler.execute({ userId });

      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      if (error instanceof WalletNotFoundError) {
        res.status(HttpStatus.NOT_FOUND).json({ error: error.message });
        return;
      }

      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: 'Error interno del servidor.' });
    }
  }
}
