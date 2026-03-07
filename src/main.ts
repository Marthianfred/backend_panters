import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    rawBody: false,
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

  const limitSize = '10000mb';

  const rawBodyBuffer = (
    req: Request,
    res: Response,
    buffer: Buffer,
    encoding: BufferEncoding,
  ) => {
    if (buffer && buffer.length) {
      req['rawBody'] = buffer;
    }
  };

  app.use(json({ verify: rawBodyBuffer, limit: limitSize }));
  app.use(
    urlencoded({ verify: rawBodyBuffer, extended: true, limit: limitSize }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(
    `[Panters] Server running on port ${port} - Vertical Slice Architecture Enabled`,
  );
}

bootstrap().catch((error) => {
  console.error('[Panters] Failed to start application', error);
});
