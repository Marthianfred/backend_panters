import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { IPtcPackageRepository } from '../domain/ptc-package.repository.interface';
import { PtcPackageEntity } from '../domain/ptc-package.entity';

@Injectable()
export class PostgresPtcPackageRepository implements IPtcPackageRepository {
  private readonly pool: Pool;
  private readonly logger = new Logger(PostgresPtcPackageRepository.name);

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.getOrThrow<string>('DATABASE_URL'),
    });
  }

  async create(
    data: Omit<PtcPackageEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<PtcPackageEntity> {
    const query = `
      INSERT INTO ptc_packages (name, ptc_amount, price_usd, stripe_price_id, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, ptc_amount AS "ptcAmount", price_usd AS "priceUsd", stripe_price_id AS "stripePriceId", is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt";
    `;

    try {
      const result = await this.pool.query(query, [
        data.name,
        data.ptcAmount,
        data.priceUsd,
        data.stripePriceId,
        data.isActive ?? true,
      ]);
      return result.rows[0];
    } catch (error) {
      this.logger.error(`Error al crear paquete de PTC: ${error.message}`);
      throw error;
    }
  }

  async update(
    id: string,
    data: Partial<Omit<PtcPackageEntity, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<PtcPackageEntity> {
    const fields = Object.keys(data);
    const setClause = fields
      .map((field, index) => {
        const dbField =
          field === 'ptcAmount'
            ? 'ptc_amount'
            : field === 'priceUsd'
              ? 'price_usd'
              : field === 'stripePriceId'
                ? 'stripe_price_id'
                : field === 'isActive'
                  ? 'is_active'
                  : field;
        return `${dbField} = $${index + 2}`;
      })
      .join(', ');

    const query = `
      UPDATE ptc_packages
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING id, name, ptc_amount AS "ptcAmount", price_usd AS "priceUsd", stripe_price_id AS "stripePriceId", is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt";
    `;

    try {
      const result = await this.pool.query(query, [id, ...Object.values(data)]);
      return result.rows[0];
    } catch (error) {
      this.logger.error(
        `Error al actualizar paquete de PTC ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async deactivate(id: string): Promise<void> {
    const query = `
      UPDATE ptc_packages
      SET is_active = false, updated_at = NOW()
      WHERE id = $1;
    `;

    try {
      await this.pool.query(query, [id]);
    } catch (error) {
      this.logger.error(
        `Error al desactivar paquete de PTC ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async activate(id: string): Promise<void> {
    const query = `
      UPDATE ptc_packages
      SET is_active = true, updated_at = NOW()
      WHERE id = $1;
    `;

    try {
      await this.pool.query(query, [id]);
    } catch (error) {
      this.logger.error(
        `Error al activar paquete de PTC ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async findById(id: string): Promise<PtcPackageEntity | null> {
    const query = `
      SELECT id, name, ptc_amount AS "ptcAmount", price_usd AS "priceUsd", stripe_price_id AS "stripePriceId", is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM ptc_packages
      WHERE id = $1;
    `;

    try {
      const result = await this.pool.query(query, [id]);
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      this.logger.error(
        `Error al buscar paquete de PTC ${id}: ${error.message}`,
      );
      throw error;
    }
  }

  async findAll(): Promise<PtcPackageEntity[]> {
    const query = `
      SELECT id, name, ptc_amount AS "ptcAmount", price_usd AS "priceUsd", stripe_price_id AS "stripePriceId", is_active AS "isActive", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM ptc_packages
      ORDER BY created_at DESC;
    `;

    try {
      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      this.logger.error(`Error al listar paquetes de PTC: ${error.message}`);
      throw error;
    }
  }
}
