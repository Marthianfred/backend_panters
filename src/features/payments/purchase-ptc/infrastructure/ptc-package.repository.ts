import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

export interface PtcPackage {
  id: string;
  name: string;
  ptcAmount: number;
  stripePriceId: string;
  isActive: boolean;
}

@Injectable()
export class PtcPackageRepository {
  private readonly pool: Pool;
  private readonly logger = new Logger(PtcPackageRepository.name);

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.getOrThrow<string>('DATABASE_URL'),
    });
  }

  /**
   * Obtiene todos los paquetes de PTC activos.
   */
  async findAllActive(): Promise<PtcPackage[]> {
    const query = `
      SELECT 
        id, 
        name, 
        ptc_amount AS "ptcAmount", 
        stripe_price_id AS "stripePriceId", 
        is_active AS "isActive"
      FROM ptc_packages
      WHERE is_active = true
      ORDER BY ptc_amount ASC;
    `;

    try {
      const result = await this.pool.query<PtcPackage>(query);
      return result.rows;
    } catch (error) {
      this.logger.error(`Error al obtener paquetes de PTC: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca un paquete por su stripe_price_id.
   */
  async findByPriceId(priceId: string): Promise<PtcPackage | null> {
    const query = `
      SELECT 
        id, 
        name, 
        ptc_amount AS "ptcAmount", 
        stripe_price_id AS "stripePriceId", 
        is_active AS "isActive"
      FROM ptc_packages
      WHERE stripe_price_id = $1 AND is_active = true;
    `;

    try {
      const result = await this.pool.query<PtcPackage>(query, [priceId]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      this.logger.error(`Error al buscar paquete de PTC por priceId ${priceId}: ${error.message}`);
      throw error;
    }
  }
}
