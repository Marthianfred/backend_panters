import { Injectable, NotFoundException } from '@nestjs/common';
import { PostgresUsersManagementRepository } from '../infrastructure/postgres.users-management.repository';
import { ModerateContentRequest } from './moderate-content.models';

@Injectable()
export class ModerateContentHandler {
  constructor(private readonly repository: PostgresUsersManagementRepository) {}

  async handle(contentId: string, request: ModerateContentRequest): Promise<{ success: boolean }> {
    
    
    await this.repository.moderateUserContent(contentId, request.action);
    return { success: true };
  }
}
