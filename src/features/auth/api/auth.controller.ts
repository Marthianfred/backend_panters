import { Controller, All, Req, Res, Get, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from '@/features/auth/application/auth.service';
import { CurrentUser } from '../decorators/current-user.decorator';
import type {
  AuthenticatedUser,
  AuthenticatedRequest,
} from '../types/auth.types';
import { AuthGuard } from '../guards/auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(AuthGuard)
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return {
      authenticated: true,
      user,
    };
  }

  @All('*path')
  async handleAuth(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    return this.authService.handleAuthRequest(req, res);
  }
}
