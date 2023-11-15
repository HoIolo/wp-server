import path = require('path');
import 'winston-daily-rotate-file';
import { LoggerOptions, format, transports } from 'winston';
import { ConfigService } from '@nestjs/config';

const config = {
  // winston 格式定义
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.prettyPrint(),
  ),
  transports: [],
};

export const getLoggerConfig = (
  configService: ConfigService,
): LoggerOptions => {
  config.transports = config.transports.concat([
    // 保存到文件
    new transports.DailyRotateFile({
      // 日志文件文件夹，建议使用path.join()方式来处理，或者process.cwd()来设置，此处仅作示范
      dirname: path.join('logs'),
      // 日志文件名 %DATE% 会自动设置为当前日期
      filename: 'application-%DATE%.info.log',
      // 日期格式
      datePattern: 'YYYY-MM-DD',
      // 压缩文档，用于定义是否对存档的日志文件进行 gzip 压缩 默认值 false
      zippedArchive: true,
      // 文件最大大小，可以是bytes、kb、mb、gb
      maxSize: '20m',
      // 最大文件数，可以是文件数也可以是天数，天数加单位"d"，
      maxFiles: '7d',
      // 格式定义，同winston
      format: format.combine(
        format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.json(),
      ),
      // 日志等级，不设置所有日志将在同一个文件
      level: 'info',
    }),
    // 同上述方法，区分error日志和info日志，保存在不同文件，方便问题排查
    new transports.DailyRotateFile({
      dirname: path.join('logs'),
      filename: 'application-%DATE%.error.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: format.combine(
        format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.json(),
      ),
      level: 'error',
    }),
  ]);
  // 如果是开发环境，添加Console transport
  if (configService.get('NODE_ENV') === 'development') {
    (config.transports as any[]).push(new transports.Console());
  }
  return config;
};

export const getDatabaseLoggerConfig = (
  configService: ConfigService,
): LoggerOptions => {
  config.transports = config.transports.concat([
    new transports.DailyRotateFile({
      dirname: path.join('logs/db'),
      filename: 'db-%DATE%.error.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: format.combine(
        format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.json(),
      ),
      level: 'error',
    }),
    new transports.DailyRotateFile({
      dirname: path.join('logs/db'),
      filename: 'db-%DATE%.info.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: format.combine(
        format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.json(),
      ),
      level: 'info',
    }),
  ]);
  // 如果是开发环境，添加Console transport
  if (configService.get('NODE_ENV') === 'development') {
    (config.transports as any[]).push(new transports.Console());
  }

  return config;
};
