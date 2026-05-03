import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { AUTH_POOL_TOKEN } from '../../infrastructure/auth.constants';

@Injectable()
export class CheckUserActivityUseCase {
  constructor(
    @Inject(AUTH_POOL_TOKEN)
    private readonly pool: Pool,
  ) {}

  /**
   * Verifica si un usuario está activo en la base de datos.
   * @param userId ID del usuario a verificar.
   * @returns true si está activo, false de lo contrario.
   */
  async execute(userId: string): Promise<boolean> {
    const query = 'SELECT is_active FROM "user" WHERE id = $1';
    const result = await this.pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return false;
    }

    return result.rows[0].is_active === true;
  }
}
