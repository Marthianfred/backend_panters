import {
  Controller,
  Get,
  Req,
  Res,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { GetTransactionHistoryHandler } from './get-transaction-history.handler';
import { AuthGuard } from '../../auth/guards/auth.guard';
import type { AuthenticatedRequest } from '../../auth/types/auth.types';

@Controller('api/v1/wallet')
@UseGuards(AuthGuard)
export class GetTransactionHistoryController {
  constructor(private readonly handler: GetTransactionHistoryHandler) {}

  @Get('transactions')
  async getTransactions(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page as string, 10) || 1;

      if (!userId) {
        res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ error: 'Usuario no autenticado.' });
        return;
      }

      const response = await this.handler.execute({ userId, page });

      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      console.error('Error in GetTransactionHistoryController:', error);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: 'Error interno al obtener el historial de transacciones.' });
    }
  }
}
