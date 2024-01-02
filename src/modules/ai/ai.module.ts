import { Module } from '@nestjs/common';
import { AIController } from './ai.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AIService } from './ai.service';

@Module({
  imports: [ConfigModule],
  providers: [ConfigService, AIService],
  controllers: [AIController],
})
export class AIModule {}
