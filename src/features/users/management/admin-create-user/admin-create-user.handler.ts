import { Injectable, Inject, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { BETTER_AUTH_TOKEN } from '../../../auth/infrastructure/auth.constants';
import type { BetterAuthInstance } from '../../../auth/types/auth.types';
import { PostgresUsersManagementRepository } from '../infrastructure/postgres.users-management.repository';
import { AdminCreateUserRequest, AdminCreateUserResponse } from './admin-create-user.models';

@Injectable()
export class AdminCreateUserHandler {
  constructor(
    @Inject(BETTER_AUTH_TOKEN)
    private readonly authInstance: BetterAuthInstance,
    private readonly repository: PostgresUsersManagementRepository,
  ) {}

  async handle(request: AdminCreateUserRequest): Promise<AdminCreateUserResponse> {
    try {
      
      const authResult = (await this.authInstance.api.signUpEmail({
        body: {
          email: request.email,
          password: request.password,
          name: request.name,
        },
      })) as { user: { id: string } | null; session: any } | null;

      if (!authResult?.user) {
        throw new InternalServerErrorException(
          'Error al crear el usuario en el proveedor de identidad.',
        );
      }

      const userId = authResult.user.id;

      
      await this.repository.updateUserRole(userId, request.role);
      await this.repository.setMustChangePassword(userId, true);

      return {
        userId: userId,
        email: request.email,
        role: request.role,
        mustChangePassword: true,
      };
    } catch (error: any) {
      if (error.code === 'P2002' || (error.message && error.message.includes('already exists'))) {
        throw new ConflictException('El correo electrónico ya está registrado.');
      }
      throw error;
    }
  }
}
