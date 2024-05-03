import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { CacheModule } from 'src/cache.module';

@Module({
  imports: [CacheModule],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
