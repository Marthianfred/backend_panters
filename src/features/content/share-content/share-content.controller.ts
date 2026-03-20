import { Controller, Get, Param, Request } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetShareInfoHandler } from './get-share-info.handler';
import { ShareInfoResponse } from './share-content.models';
import type { AuthenticatedRequest } from '../../auth/types/auth.types';

@ApiTags('Content Sharing (Public & Viral)')
@Controller('api/v1/content')
export class ShareContentController {
  constructor(private readonly handler: GetShareInfoHandler) {}

  @Get('share-info/:id')
  @ApiOperation({ summary: 'Obtener información pública del post para links compartidos' })
  @ApiResponse({ status: 200, type: ShareInfoResponse })
  @ApiResponse({ status: 404, description: 'Post no encontrado' })
  public async getInfo(
    @Param('id') contentId: string,
    @Request() req: AuthenticatedRequest
  ): Promise<ShareInfoResponse> {
    // Si el usuario no está logueado por Better Auth, req.user será null.
    // El frontend pasa el token si lo tiene, para verificar si ya es dueño.
    const userId = req.user?.id;
    return await this.handler.execute(contentId, userId);
  }
}
