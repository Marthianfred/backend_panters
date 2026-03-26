import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SchemaInitializationService implements OnModuleInit {
  private readonly logger = new Logger(SchemaInitializationService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    this.logger.log(
      'Iniciando verificación y migración manual de esquema para BetterAuth...',
    );

    try {
      const possiblePaths = [
        path.join(process.cwd(), 'src/features/auth/infrastructure/init-schema.sql'),
        path.join(process.cwd(), 'dist/features/auth/infrastructure/init-schema.sql'),
      ];

      const sqlPath = possiblePaths.find((p) => fs.existsSync(p));

      if (!sqlPath) {
        this.logger.warn(
          `No se encontró el archivo de esquema en las rutas intentadas: ${possiblePaths.join(', ')}`,
        );
        return;
      }

      const sql = fs.readFileSync(sqlPath, 'utf8');

      await this.dataSource.query(sql);

      this.logger.log(
        'Esquema de BetterAuth verificado/aplicado exitosamente.',
      );
    } catch (error) {
      this.logger.error('Error al aplicar el esquema de BetterAuth:', error);
    }
  }
}
