import { Controller, Get, UseGuards } from '@nestjs/common';
import { GetPantersHandler } from './get-panters.handler';
import { GetPantersResponse } from './get-panters.models';
// Assuming you have AuthGuard established as described in global rules
import { AuthGuard } from '../../auth/guards/auth.guard';

@Controller('panters')
export class GetPantersController {
  constructor(private readonly getPantersHandler: GetPantersHandler) {}

  @Get()
  // Depending on requirements, to list panters it could be public,
  // but let's assume authenticated users can query this for now.
  @UseGuards(AuthGuard)
  public async getPanters(): Promise<GetPantersResponse> {
    // Send an empty request for now, or you could pass filters from queries
    return this.getPantersHandler.execute({});
  }
}
