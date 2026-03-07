import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true, // Habilitar el nativo de NestJS para evitar colisiones
    rawBody: true,
  });

  app.enableCors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
    ],
  });

  // Habilitar tamaños de carga colosales globalmente para evitar el Error 413 "Payload Too Large"
  app.use(json({ limit: '10000mb' }));
  app.use(urlencoded({ extended: true, limit: '10000mb' }));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(
    `[Panters] Server running on port ${port} - Vertical Slice Architecture Enabled`,
  );
}

bootstrap().catch((error) => {
  console.error('[Panters] Failed to start application', error);
});
