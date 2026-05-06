import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { AUTH_POOL_TOKEN } from '@/features/auth/infrastructure/auth.constants';
import { NotifyUserUseCase } from './notify-user.use-case';

@Injectable()
export class NotifyAdminsUseCase {
  constructor(
    @Inject(AUTH_POOL_TOKEN)
    private readonly pool: Pool,
    private readonly notifyUserUseCase: NotifyUserUseCase,
  ) {}

  async execute(payload: {
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<void> {
    try {
      const ADMIN_ROLE_NAME = 'admin';

      const result = await this.pool.query<{ id: string }>(
        'SELECT id FROM "user" WHERE "role" = $1 AND "is_active" = true',
        [ADMIN_ROLE_NAME],
      );

      const adminIds = result.rows.map((row) => row.id);

      if (adminIds.length === 0) {
        return;
      }

      const promises = adminIds.map((adminId) =>
        this.notifyUserUseCase
          .execute(adminId, {
            title: payload.title,
            body: payload.body,
            icon: '/icons/admin-alert.png',
            data: payload.data,
          })
          .catch((err: unknown) =>
            console.error(
              `[NOTIFY_ADMINS] Error notificando al admin ${adminId}:`,
              err,
            ),
          ),
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('[NOTIFY_ADMINS_CRITICAL_ERROR]', error);
    }
  }
}
