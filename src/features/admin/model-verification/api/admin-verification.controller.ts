import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@/features/auth/guards/auth.guard';
import { RolesGuard } from '@/features/auth/guards/roles.guard';
import { Roles } from '@/features/auth/decorators/roles.decorator';
import { VerifyModelUseCase } from '../application/use-cases/verify-model/verify-model.use-case';
import { GetPendingVerificationsUseCase } from '../application/use-cases/get-pending-verifications/get-pending-verifications.use-case';
import { VerifyModelRequest } from '../application/use-cases/verify-model/verify-model.dto';
import type { AuthenticatedRequest } from '@/features/auth/types/auth.types';

@Controller('api/v1/admin/model-verification')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class AdminVerificationController {
  constructor(
    private readonly verifyModelUseCase: VerifyModelUseCase,
    private readonly getPendingVerificationsUseCase: GetPendingVerificationsUseCase,
  ) {}

  @Get('pending')
  async getPendingVerifications() {
    return this.getPendingVerificationsUseCase.execute();
  }

  @Post('verify')
  async verifyModel(
    @Req() req: AuthenticatedRequest,
    @Body() data: VerifyModelRequest,
  ) {
    if (!req.user) throw new BadRequestException('Usuario no autenticado');
    const adminId = req.user.id;
    return this.verifyModelUseCase.execute(adminId, data);
  }
}
