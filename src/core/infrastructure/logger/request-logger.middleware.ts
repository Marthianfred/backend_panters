import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    // Solo loguear en modo desarrollo
    if (process.env.NODE_ENV === 'development') {
      const { method, originalUrl, headers } = req;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const body = req.body;
      const userAgent = (headers['user-agent'] as string) || '';
      const startTime = Date.now();

      this.logger.debug(
        `[Request] ${method} ${originalUrl} - Agent: ${userAgent}`,
      );
      this.logger.debug(`[Headers] ${JSON.stringify(headers, null, 2)}`);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      if (body && Object.keys(body).length > 0) {
        this.logger.debug(`[Body] ${JSON.stringify(body, null, 2)}`);
      }

      // Capturar la función original de envío para acceder a la respuesta
      const originalSend = res.send;
      let responseBody: unknown;

      res.send = function (...args: [unknown]): Response {
        responseBody = args[0];
        // Restaurar la función para evitar loops infinitos y ejecutarla
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
        return originalSend.apply(this, args as any);
      };

      res.on('finish', () => {
        const { statusCode } = res;
        const duration = Date.now() - startTime;

        this.logger.debug(
          `[Response] ${method} ${originalUrl} -> ${statusCode} (${duration}ms)`,
        );

        if (responseBody) {
          try {
            // Se intenta parsear por si NestJS o Express lo serializó como String previamente
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const bodyToFormat =
              typeof responseBody === 'string'
                ? JSON.parse(responseBody)
                : responseBody;

            this.logger.debug(
              `[Response Payload] ${JSON.stringify(bodyToFormat, null, 2)}`,
            );
          } catch {
            const rawOutput =
              typeof responseBody === 'object' && responseBody !== null
                ? JSON.stringify(responseBody)
                : String(responseBody);

            this.logger.debug(`[Response Payload (Raw)] ${rawOutput}`);
          }
        }
      });
    }

    next();
  }
}
