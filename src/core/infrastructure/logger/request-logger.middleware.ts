import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    // Solo loguear en modo desarrollo
    if (process.env.NODE_ENV === 'development') {
      const { method, originalUrl, headers, body } = req;
      const userAgent = headers['user-agent'] || '';
      const startTime = Date.now();

      this.logger.debug(
        `[Request] ${method} ${originalUrl} - Agent: ${userAgent}`,
      );
      this.logger.debug(`[Headers] ${JSON.stringify(headers, null, 2)}`);
      if (body && Object.keys(body).length > 0) {
        this.logger.debug(`[Body] ${JSON.stringify(body, null, 2)}`);
      }

      // Capturar la función original de envío para acceder a la respuesta
      const originalSend = res.send;
      let responseBody: any;

      res.send = function (bodyContent: any) {
        responseBody = bodyContent;
        // Restaurar la función para evitar loops infinitos y ejecutarla
        return originalSend.apply(this, arguments as any);
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
            const parsedBody =
              typeof responseBody === 'string'
                ? JSON.parse(responseBody)
                : responseBody;

            this.logger.debug(
              `[Response Payload] ${JSON.stringify(parsedBody, null, 2)}`,
            );
          } catch (e) {
            // Si no es JSON o no se puede parsear
            this.logger.debug(`[Response Payload (Raw)] ${responseBody}`);
          }
        }
      });
    }

    next();
  }
}
