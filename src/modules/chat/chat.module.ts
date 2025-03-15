import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { CacheModule } from 'src/cache.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessage } from './entity/chat-message.entity';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    CacheModule,
    TypeOrmModule.forFeature([ChatMessage]),
    ScheduleModule.forRoot(),
  ],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
