import { Injectable, NotFoundException } from '@nestjs/common';
import { PostgresUsersManagementRepository } from '../infrastructure/postgres.users-management.repository';
import { ModerateContentRequest } from './moderate-content.models';

@Injectable()
export class ModerateContentHandler {
  constructor(private readonly repository: PostgresUsersManagementRepository) {}

  async handle(contentId: string, request: ModerateContentRequest): Promise<{ success: boolean }> {
    // Nota: Aquí se podría validar la existencia del contenido, pero el repo lo hace implícitamente en el UPDATE.
    // Para cumplir con el requerimiento de "gestiones de moderación en las publicaciones (Desactivarlas o Borrarlas)".
    await this.repository.moderateUserContent(contentId, request.action);
    return { success: true };
  }
}
