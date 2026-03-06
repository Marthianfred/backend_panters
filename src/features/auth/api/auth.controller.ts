import { Controller, All, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from '../application/auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @All('*')
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    return this.authService.handleAuthRequest(req, res);
  }
}
