import { Controller, All, Req, Res, Get, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from '@/features/auth/application/auth.service';
import { CurrentUser } from '../decorators/current-user.decorator';
import type {
  AuthenticatedUser,
  AuthenticatedRequest,
} from '../types/auth.types';
import { AuthGuard } from '../guards/auth.guard';

import { RegisterModelUseCase } from '../application/use-cases/register-model/register-model.use-case';
import { RegisterModelRequest } from '../application/use-cases/register-model/register-model.dto';
import { Post, Body } from '@nestjs/common';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly registerModelUseCase: RegisterModelUseCase,
  ) {}

  @Get('me')
  @UseGuards(AuthGuard)
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return {
      authenticated: true,
      user,
    };
  }

  @Post('register-model')
  async registerModel(@Body() data: RegisterModelRequest) {
    return this.registerModelUseCase.execute(data);
  }

  @All('*path')
  async handleAuth(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    return this.authService.handleAuthRequest(req, res);
  }
}
