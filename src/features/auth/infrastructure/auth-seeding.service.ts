import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { BETTER_AUTH_TOKEN } from '../infrastructure/better-auth.provider';
import { DataSource } from 'typeorm';

interface BetterAuthApi {
  signUpEmail: (options: Record<string, any>) => Promise<unknown>;
}

interface BetterAuthInstance {
  api: BetterAuthApi;
}

@Injectable()
export class AuthSeedingService implements OnModuleInit {
  private readonly logger = new Logger(AuthSeedingService.name);

  constructor(
    @Inject(BETTER_AUTH_TOKEN)
    private readonly authInstance: BetterAuthInstance,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Verificando usuario administrador inicial...');
    try {
      // Usamos DataSource en lugar de la instancia de base de datos interna de BetterAuth
      const adminExists = await this.dataSource.query(
        'SELECT id FROM "user" WHERE role = \'admin\' LIMIT 1',
      );

      if (adminExists.length === 0) {
        this.logger.log('No se encontró administrador. Creando uno inicial...');

        // Better Auth API server-side espera el cuerpo en un objeto 'body'
        // para emular la estructura de una petición si se usa vía API Genérica
        try {
          await this.authInstance.api.signUpEmail({
            body: {
              email: 'admin@panters.com',
              password: 'adminPassword123',
              name: 'Panters Admin',
            },
          });
        } catch (e) {
          // Si el usuario ya existe (ej. de intentos anteriores fallidos en el rol), ignoramos el error de dupliicado
          this.logger.debug(
            'Nota: El usuario ya podría existir, procediendo a forzar rol.',
          );
        }

        // Actualizamos el rol a admin manualmente porque signUpEmail usa el default de la tabla
        await this.dataSource.query(
          'UPDATE "user" SET role = \'admin\' WHERE email = $1',
          ['admin@panters.com'],
        );

        this.logger.log(
          'Usuario administrador inicial sincronizado: admin@panters.com / adminPassword123',
        );
      } else {
        this.logger.log('Usuario administrador ya existe.');
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error en seeding de administrador: ${message}`);
    }
  }
}
