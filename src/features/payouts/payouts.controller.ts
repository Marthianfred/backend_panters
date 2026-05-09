import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CreatePayoutRequestDto } from './commands/create-payout-request/create-payout-request.dto';
import { CreatePayoutRequestCommand } from './commands/create-payout-request/create-payout-request.command';
import { GetPendingPayoutsHandler } from './queries/get-pending-payouts/get-pending-payouts.handler';
import { ApprovePayoutRequestHandler } from './commands/approve-payout-request/approve-payout-request.handler';
import { ConfirmPayoutReceiptHandler } from './commands/confirm-payout-receipt/confirm-payout-receipt.handler';
import { GetCreatorPayoutHistoryQuery } from './queries/get-creator-payout-history/get-creator-payout-history.query';
import { CreatePayoutRequestHandler } from './commands/create-payout-request/create-payout-request.handler';
import { GetCreatorPayoutHistoryHandler } from './queries/get-creator-payout-history/get-creator-payout-history.handler';
import { GetAdminPayoutHistoryHandler } from './queries/get-admin-payout-history/get-admin-payout-history.handler';
import { ApprovePayoutRequestCommand } from './commands/approve-payout-request/approve-payout-request.command';
import { ConfirmPayoutReceiptCommand } from './commands/confirm-payout-receipt/confirm-payout-receipt.command';
import { AuthGuard } from '@/features/auth/guards/auth.guard';
import { RolesGuard } from '@/core/auth/guards/roles.guard';
import { Roles } from '@/core/auth/decorators/roles.decorator';
import { Role } from '@/core/auth/roles.enum';

@Controller('api/v1/payouts')
@UseGuards(AuthGuard, RolesGuard)
export class PayoutsController {
  constructor(
    private readonly createPayoutRequestHandler: CreatePayoutRequestHandler,
    private readonly getPendingPayoutsHandler: GetPendingPayoutsHandler,
    private readonly approvePayoutRequestHandler: ApprovePayoutRequestHandler,
    private readonly confirmPayoutReceiptHandler: ConfirmPayoutReceiptHandler,
    private readonly getCreatorPayoutHistoryHandler: GetCreatorPayoutHistoryHandler,
    private readonly getAdminPayoutHistoryHandler: GetAdminPayoutHistoryHandler,
  ) {}

  @Post()
  @Roles(Role.MODEL)
  async create(@Body() dto: CreatePayoutRequestDto) {
    return this.createPayoutRequestHandler.execute(
      new CreatePayoutRequestCommand(dto),
    );
  }

  @Get('pending')
  @Roles(Role.ADMIN)
  async getPending() {
    return this.getPendingPayoutsHandler.execute();
  }

  @Get('admin/history')
  @Roles(Role.ADMIN)
  async getAdminHistory() {
    return this.getAdminPayoutHistoryHandler.execute();
  }

  @Patch(':id/approve')
  @Roles(Role.ADMIN)
  async approve(
    @Param('id') payoutId: string,
    @Body('adminId') adminId: string,
  ) {
    return this.approvePayoutRequestHandler.execute(
      new ApprovePayoutRequestCommand({ payoutId, adminId }),
    );
  }

  @Patch(':id/confirm')
  @Roles(Role.MODEL)
  async confirm(
    @Param('id') payoutId: string,
    @Body('creatorId') creatorId: string,
  ) {
    return this.confirmPayoutReceiptHandler.execute(
      new ConfirmPayoutReceiptCommand({ payoutId, creatorId }),
    );
  }

  @Get('history/:creatorId')
  @Roles(Role.MODEL, Role.ADMIN)
  async getHistory(@Param('creatorId') creatorId: string) {
    return this.getCreatorPayoutHistoryHandler.execute(
      new GetCreatorPayoutHistoryQuery(creatorId),
    );
  }
}
