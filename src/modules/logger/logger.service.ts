import { Logger, createLogger } from 'winston';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getLoggerConfig } from 'src/config/logger.config';

@Injectable()
export class LoggerService {
  private context?: string;
  private logger: Logger;

  public setContext(context: string): void {
    this.context = context;
  }

  constructor(private configService: ConfigService) {
    this.logger = createLogger(getLoggerConfig(this.configService));
  }

  // 错误日志记录
  error(ctx: any, message: string, meta?: Record<string, any>): Logger {
    return this.logger.error({
      message,
      contextNmae: this.context,
      ctx,
      ...meta,
    });
  }
  // 警告日志记录
  warn(ctx: any, message: string, meta?: Record<string, any>): Logger {
    return this.logger.warn({
      message,
      contextNmae: this.context,
      ctx,
      ...meta,
    });
  }
  // debug日志记录
  debug(ctx: any, message: string, meta?: Record<string, any>): Logger {
    return this.logger.debug({
      message,
      contextNmae: this.context,
      ctx,
      ...meta,
    });
  }
  // 基本日志记录
  info(ctx: any, message: string, meta?: Record<string, any>): Logger {
    return this.logger.info({
      message,
      contextNmae: this.context,
      ctx,
      ...meta,
    });
  }
}
