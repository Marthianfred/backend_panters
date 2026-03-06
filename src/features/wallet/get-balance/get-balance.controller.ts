import { Controller, Get, Req, Res, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { GetBalanceHandler } from './get-balance.handler';
import { WalletNotFoundError } from './get-balance.models';

@Controller('api/v1/wallet')
export class GetBalanceController {
  constructor(private readonly handler: GetBalanceHandler) {}

  @Get('balance')
  async getBalance(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id || 'anonymous-user';

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

      console.error('Error obteniendo balance de wallet:', error);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: 'Error interno del servidor.' });
    }
  }
}
