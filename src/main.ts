import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  // 1. Deshabilitamos el bodyParser de NestJS desde la creación de la instancia
  // Esto es obligatorio para que Better Auth reciba el Request Input Stream crudo.
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  // 2. Configuración obligatoria de CORS para Better Auth (Requiere credentials = true para manejo de set-cookie)
  app.enableCors({
    origin: process.env.CORS_ORIGIN || true, // En producción limitar al origin del frontend exacto (ej: 'https://midominio.com')
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
    ],
  });

  // 3. Patrón de diseño Middleware condicional (Open/Closed Principle)
  // Como desactivamos el bodyParser global, inyectamos interceptores de Express manualmente
  // Excluimos explícitamente las rutas bajo '/api/auth' para que sigan con su raw stream.
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/auth')) {
      // Ignorar el parseo para las rutas delegadas a Better Auth
      return next();
    }

    // Aplicar parseo JSON y UrlEncoded para todos los demás Vertical Slices estándar de NestJS
    json({ limit: '50mb' })(req, res, (err) => {
      if (err) return next(err);
      urlencoded({ extended: true, limit: '50mb' })(req, res, next);
    });
  });

  // 4. Iniciar servicio
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(
    `[Panters] Server running on port ${port} - Vertical Slice Architecture Enabled`,
  );
}

bootstrap().catch((error) => {
  console.error('[Panters] Failed to start application', error);
});
