import { Module } from '@nestjs/common';
import { redisFactory } from './config/redis.config';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: redisFactory,
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class CacheModule {}
