import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const { message, code } = exception.getResponse() as any;

    res.status(status).json({
      code: code || status,
      timestamp: new Date().toLocaleString(),
      path: req.url,
      error: 'Bad Request',
      message,
    });
  }
}
