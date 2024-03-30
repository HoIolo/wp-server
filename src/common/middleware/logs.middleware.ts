import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { LoggerService } from 'src/modules/logger/logger.service';

@Injectable()
class LogsMiddleware implements NestMiddleware {
  constructor(private readonly LoggerService: LoggerService) {
    this.LoggerService.setContext(LogsMiddleware.name);
  }

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

      const message = `${method} ${originalUrl} ${statusCode} ${statusMessage}`;

      if (statusCode >= 500) {
        return this.LoggerService.error(requestParams, message);
      }

      if (statusCode >= 400) {
        return this.LoggerService.warn(requestParams, message);
      }

      return this.LoggerService.info(requestParams, message);
    });

    next();
  }
}

export default LogsMiddleware;
