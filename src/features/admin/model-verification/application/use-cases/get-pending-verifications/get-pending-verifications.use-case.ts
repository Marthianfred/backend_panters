import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { AUTH_POOL_TOKEN } from '@/features/auth/infrastructure/auth.constants';

export interface PendingVerification {
  id: string;
  userId: string;
  name: string;
  email: string;
  username: string;
  status: string;
  createdAt: Date;
}

@Injectable()
export class GetPendingVerificationsUseCase {
  constructor(
    @Inject(AUTH_POOL_TOKEN)
    private readonly pool: Pool,
  ) {}

  async execute(): Promise<PendingVerification[]> {
    const query = `
      SELECT 
        mv.id,
        mv.user_id as "userId",
        u.name,
        u.email,
        u.username,
        mv.status,
        mv.created_at as "createdAt"
      FROM model_verifications mv
      JOIN "user" u ON mv.user_id = u.id
      WHERE mv.status = 'PENDING'
      ORDER BY mv.created_at ASC
    `;

    const result = await this.pool.query<PendingVerification>(query);
    return result.rows;
  }
}
