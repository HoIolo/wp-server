import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
class LogsMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction) {
    response.on('finish', () => {
      const { method, originalUrl, query, body } = request;
      const { statusCode, statusMessage } = response;

      let requestParams = '';
      if (query && JSON.stringify(query) !== '{}') {
        requestParams = JSON.stringify(query);
      }
      if (body && JSON.stringify(body) !== '{}') {
        requestParams = JSON.stringify(body);
      }

      const message = `${method} ${originalUrl} ${statusCode} ${statusMessage} ${requestParams}`;

      if (statusCode >= 500) {
        return this.logger.error(message);
      }

      if (statusCode >= 400) {
        return this.logger.warn(message);
      }

      return this.logger.log(message);
    });

    next();
  }
}

export default LogsMiddleware;
