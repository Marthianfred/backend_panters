import {
  Injectable,
  BadRequestException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { AUTH_POOL_TOKEN } from '@/features/auth/infrastructure/auth.constants';
import { VerifyModelRequest, VerificationDecision } from './verify-model.dto';
import { NotifyUserUseCase } from '@/features/notifications/application/use-cases/notify-user.use-case';

@Injectable()
export class VerifyModelUseCase {
  constructor(
    @Inject(AUTH_POOL_TOKEN)
    private readonly pool: Pool,
    private readonly notifyUserUseCase: NotifyUserUseCase,
  ) {}

  async execute(
    adminId: string,
    data: VerifyModelRequest,
  ): Promise<{ success: boolean; message: string }> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Obtener la verificación
      const verifResult = await client.query<{
        user_id: string;
        status: string;
      }>('SELECT user_id, status FROM model_verifications WHERE id = $1', [
        data.verificationId,
      ]);

      if (verifResult.rows.length === 0) {
        throw new NotFoundException('Solicitud de verificación no encontrada.');
      }

      const row = verifResult.rows[0];
      const userId = row.user_id;
      const status = row.status;

      if (status !== 'PENDING') {
        throw new BadRequestException('Esta solicitud ya ha sido procesada.');
      }

      // 2. Procesar decisión
      const isApproved = data.decision === VerificationDecision.APPROVE;
      const finalStatus = isApproved ? 'APPROVED' : 'REJECTED';

      await client.query(
        `UPDATE model_verifications 
         SET status = $1, rejection_reason = $2, admin_id = $3, verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $4`,
        [
          finalStatus,
          data.rejectionReason || null,
          adminId,
          data.verificationId,
        ],
      );

      if (isApproved) {
        await client.query('UPDATE "user" SET is_active = true WHERE id = $1', [
          userId,
        ]);
      }

      await client.query('COMMIT');

      // 3. Notificar a la modelo
      this.notifyUserUseCase
        .execute(userId, {
          title: isApproved
            ? '¡Tu perfil ha sido aprobado! 🎉'
            : 'Actualización de tu perfil ℹ️',
          body: isApproved
            ? 'Bienvenida a Panters. Ya puedes iniciar sesión y empezar a crear contenido.'
            : `Tu solicitud no pudo ser aprobada. Motivo: ${data.rejectionReason || 'No especificado'}.`,
          icon: isApproved ? '/icons/success.png' : '/icons/alert.png',
          data: {
            type: 'MODEL_VERIFICATION_RESULT',
            status: finalStatus,
          },
        })
        .catch((err: unknown) =>
          console.error('[NOTIFY_MODEL_VERIFICATION_ERROR]', err),
        );

      return {
        success: true,
        message: isApproved
          ? 'Modelo aprobada con éxito.'
          : 'Modelo rechazada.',
      };
    } catch (error: unknown) {
      await client.query('ROLLBACK');
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        'Error al procesar la verificación de la modelo.',
      );
    } finally {
      client.release();
    }
  }
}
