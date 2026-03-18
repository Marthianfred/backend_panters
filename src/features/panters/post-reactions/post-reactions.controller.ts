import { Body, Controller, Post, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '../../auth/guards/auth.guard';
import type { AuthenticatedRequest } from '../../auth/types/auth.types';
import { ReactToPostHandler } from './post-reactions.handler';
import { ReactToPostDto, PostReactionResponse } from './post-reactions.models';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Panter Wall Interactions')
@ApiBearerAuth()
@Controller('api/v1/panters')
export class PostReactionsController {
  constructor(private readonly handler: ReactToPostHandler) {}

  @Post('/posts/react')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reaccionar con una Pantera a un post del muro' })
  @ApiResponse({
    status: 200,
    description: 'Reacción acumulada exitosamente',
    type: PostReactionResponse,
  })
  @ApiResponse({ status: 404, description: 'Publicación no encontrada' })
  public async react(
    @Request() req: AuthenticatedRequest,
    @Body() body: ReactToPostDto
  ): Promise<PostReactionResponse> {
    const userId = req.user.id;
    return await this.handler.execute(userId, body);
  }
}
