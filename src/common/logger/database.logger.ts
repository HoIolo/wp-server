import { Logger as TypeOrmLogger } from 'typeorm';
import { createLogger } from 'winston';
import { getDatabaseLoggerConfig } from 'src/config/logger.config';
import { ConfigService } from '@nestjs/config';

class DatabaseLogger implements TypeOrmLogger {
  // private readonly logger = new NestLogger('SQL');

  private readonly logger = createLogger(
    getDatabaseLoggerConfig(new ConfigService()),
  );

  logQuery(query: string, parameters?: unknown[]) {
    this.logger.info(
      `${query} -- Parameters: ${this.stringifyParameters(parameters)}`,
    );
  }

  logQueryError(error: string, query: string, parameters?: unknown[]) {
    this.logger.error(
      `${query} -- Parameters: ${this.stringifyParameters(
        parameters,
      )} -- ${error}`,
    );
  }

  logQuerySlow(time: number, query: string, parameters?: unknown[]) {
    this.logger.warn(
      `Time: ${time} -- Parameters: ${this.stringifyParameters(
        parameters,
      )} -- ${query}`,
    );
  }

  logMigration(message: string) {
    this.logger.info(message);
  }

  logSchemaBuild(message: string) {
    this.logger.info(message);
  }

  log(level: 'log' | 'info' | 'warn', message: string) {
    if (level === 'log') {
      return this.logger.info(message);
    }
    if (level === 'info') {
      return this.logger.debug(message);
    }
    if (level === 'warn') {
      return this.logger.warn(message);
    }
  }

  private stringifyParameters(parameters?: unknown[]) {
    try {
      return JSON.stringify(parameters);
    } catch {
      return '';
    }
  }
}

export default DatabaseLogger;
