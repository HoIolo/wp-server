import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const redisFactory = (config: ConfigService) =>
  new Redis({
    port: config.get('REDIS_PORT'),
    host: config.get('REDIS_HOST'),
  });
