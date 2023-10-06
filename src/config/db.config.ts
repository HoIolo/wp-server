import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import DatabaseLogger from 'src/common/logger/database.logger';

export const dbFactory = (config: ConfigService) =>
  ({
    type: config.get('DB_TYPE'),
    host: config.get('DB_HOST'),
    port: config.get('DB_PORT'),
    username: config.get('DB_USERNAME'),
    password: config.get('DB_PASSWORD'),
    database: config.get('DB_DATABASE'),
    keepConnectionAlive: true,
    autoLoadEntities: true,
    timezone: '+08:00',
    logger: new DatabaseLogger(),
    synchronize: true,
  } as TypeOrmModuleOptions);
