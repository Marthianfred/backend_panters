import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { BETTER_AUTH_TOKEN } from './auth.constants';
import { DataSource } from 'typeorm';
import { SchemaInitializationService } from '@/core/database/schema-initialization.service';

import type { BetterAuthInstance } from '../types/auth.types';

@Injectable()
export class AuthSeedingService implements OnModuleInit {
  private readonly logger = new Logger(AuthSeedingService.name);

  constructor(
    @Inject(BETTER_AUTH_TOKEN)
    private readonly authInstance: BetterAuthInstance,
    private readonly dataSource: DataSource,
    private readonly schemaService: SchemaInitializationService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.schemaService.ensureInitialized();

    this.logger.log(
      'Iniciando seeding de usuarios base (Admin, Moderador, Cliente)...',
    );

    await this.seedUser(
      'admin@panters.com',
      'adminPassword123',
      'Panters Admin',
      'admin',
    );
    await this.seedUser(
      'moderator@panters.com',
      'moderatorPassword123',
      'Panters Moderador',
      'moderator',
    );
    await this.seedUser(
      'client@panters.com',
      'clientPassword123',
      'Panters Cliente',
      'subscriber',
    );
  }

  private async seedUser(
    email: string,
    pass: string,
    name: string,
    role: string,
  ) {
    try {
      const userExists = await this.dataSource.query<{ id: string }[]>(
        'SELECT id FROM "user" WHERE email = $1 LIMIT 1',
        [email],
      );

      let userId = '';

      if (userExists.length === 0) {
        this.logger.log(`Creando usuario: ${email} con rol ${role}...`);

        try {
          await this.authInstance.api.signUpEmail({
            body: {
              email: email,
              password: pass,
              name: name,
            },
          });
        } catch {
          this.logger.debug(
            `Usuario ${email} tuvo conflicto en Auth (posible intento previo). Forzando sincronización.`,
          );
        }

        const user = await this.dataSource.query<{ id: string }[]>(
          'SELECT id FROM "user" WHERE email = $1 LIMIT 1',
          [email],
        );

        if (user.length > 0) {
          userId = user[0].id;

          await this.dataSource.query(
            'UPDATE "user" SET role = $1 WHERE email = $2',
            [role, email],
          );
        }
      } else {
        userId = userExists[0].id;

        await this.dataSource.query(
          'UPDATE "user" SET role = $1 WHERE email = $2',
          [role, email],
        );
        this.logger.log(`Usuario ${email} ya existe. Perfil validado.`);
      }

      if (userId) {
        await this.dataSource.query(
          `
          INSERT INTO "antigravity_profiles" (user_id, full_name, avatar_url, bio, is_active)
          VALUES ($1, $2, $3, $4, true)
          ON CONFLICT (user_id) DO NOTHING
        `,
          [
            userId,
            name,
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
            `Perfil del sistema para ${name} (${role})`,
          ],
        );

        const startingBalance = role === 'subscriber' ? 500 : 99999;
        await this.dataSource.query(
          `
          INSERT INTO "antigravity_wallets" (user_id, panter_coin_balance)
          VALUES ($1, $2)
          ON CONFLICT (user_id) DO NOTHING
        `,
          [userId, startingBalance],
        );

        this.logger.log(
          `Perfil y Billetera conformados para: ${email} (Rol: ${role})`,
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error en seeding de usuario ${email}: ${message}`);
    }
  }
}
