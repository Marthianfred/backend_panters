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
import { UploadContentHandler } from './upload-content.handler';
import { Roles } from '../../../core/auth/decorators/roles.decorator';
import { Role } from '../../../core/auth/roles.enum';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { InvalidPriceError } from './upload-content.models';

@Controller('api/v1/content')
@UseGuards(RolesGuard)
export class UploadContentController {
  constructor(private readonly handler: UploadContentHandler) {}

  @Post('upload')
  @Roles(Role.PANTER, Role.ADMIN) // Sólo creadoras y administradores pueden subir
  public async upload(
    @Req() req: Request,
    @Body() body: { title: string; description: string; price: number },
    @Res() res: Response,
  ): Promise<void> {
    try {
      // Simula sacar de req.user
      const creatorId =
        (req as any).user?.id || req.headers['x-mock-user-id'] || 'panter_777';

      const response = await this.handler.execute({
        creatorId: creatorId as string,
        title: body.title,
        description: body.description,
        priceInPanterCoins: body.price,
      });

      res.status(HttpStatus.CREATED).json(response);
    } catch (error) {
      if (error instanceof InvalidPriceError) {
        res.status(HttpStatus.BAD_REQUEST).json({ error: error.message });
        return;
      }
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Ocurrió un error subiendo metadatos',
      });
    }
  }
}
