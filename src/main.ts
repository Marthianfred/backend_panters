import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
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

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/auth')) {
      return next();
    }

    json({ limit: '50mb' })(req, res, (err) => {
      if (err) return next(err);
      urlencoded({ extended: true, limit: '50mb' })(req, res, next);
    });
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(
    `[Panters] Server running on port ${port} - Vertical Slice Architecture Enabled`,
  );
}

bootstrap().catch((error) => {
  console.error('[Panters] Failed to start application', error);
});
