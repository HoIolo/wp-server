import { Inject, Injectable, Logger } from '@nestjs/common';
import { Profile } from '../user/entity/profile.entity';
import { Redis } from 'ioredis';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './entity/chat-message.entity';
import { Interval } from '@nestjs/schedule';

interface OnlineUser {
  onlineUser: Profile;
  status: string;
  id: string;
}

interface ChartMessage {
  user: Profile;
  msg: string;
  id: string;
}

interface OnlineUsers {
  userQueue: Array<OnlineUser>;
  currentUser: OnlineUser;
  trigger: 'fadeIn' | 'fadeOut';
}

@Injectable()
export class ChatService {
  onlineUsers: OnlineUsers;
  userOnlineList: Array<OnlineUser> = [];
  chartMessageList: Array<ChartMessage> = [];
  private REDIS_CHAT_KEY = 'chatMessage';
  private REDIS_PENDING_KEY = 'pendingChatMessage';
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
  ) {
    // 从数据库加载历史消息
    this.loadHistoryMessages();

    // 保持Redis兼容性，同时从Redis加载
    this.redis.lrange(this.REDIS_CHAT_KEY, 0, -1, (err, chatMessage) => {
      if (err) {
        console.log(err);
      }
      if (chatMessage) {
        // 将Redis中的消息添加到列表中
        const redisMessages = chatMessage.map((item) => {
          return JSON.parse(item);
        });
        // 合并消息，避免重复
        this.mergeMessages(redisMessages);
      }
    });
    this.onlineUsers = {
      userQueue: [],
      currentUser: null,
      trigger: 'fadeIn',
    };
  }

  /**
   * 统计在线用户
   * @param connectUser
   */
  countOnlineUser(connectUser: OnlineUser) {
    const user = this.onlineUsers.userQueue.find(
      (item) => item.onlineUser.id === connectUser.onlineUser.id,
    );
    if (user) {
      return this.onlineUsers;
    }
    this.onlineUsers.userQueue.push(connectUser);
    return this.onlineUsers;
  }

  /**
   * 保存聊天消息
   * @param receiveMsg
   * @returns
   */
  async saveChartMessage(receiveMsg: ChartMessage) {
    this.chartMessageList.push(receiveMsg);

    // 先保存到Redis
    await this.redis.rpush(this.REDIS_CHAT_KEY, JSON.stringify(receiveMsg));
    // 添加到待处理队列
    await this.redis.rpush(this.REDIS_PENDING_KEY, JSON.stringify(receiveMsg));

    return receiveMsg;
  }

  /**
   * 定时任务：每30秒将Redis中的消息批量写入MySQL
   */
  @Interval(30000)
  async batchSaveMessagesToDatabase() {
    try {
      // 获取待处理的消息数量
      const pendingCount = await this.redis.llen(this.REDIS_PENDING_KEY);

      if (pendingCount === 0) {
        return; // 没有待处理的消息
      }

      this.logger.log(`开始批量处理 ${pendingCount} 条聊天消息`);

      // 获取所有待处理的消息
      const pendingMessages = await this.redis.lrange(
        this.REDIS_PENDING_KEY,
        0,
        -1,
      );

      // 解析消息并准备批量插入
      const messagesToSave: ChatMessage[] = [];

      for (const msgStr of pendingMessages) {
        try {
          const msg = JSON.parse(msgStr) as ChartMessage;
          const chatMessage = new ChatMessage();
          chatMessage.user = msg.user;
          chatMessage.msg = msg.msg;
          chatMessage.socketId = msg.id;
          messagesToSave.push(chatMessage);
        } catch (err) {
          this.logger.error(`解析消息失败: ${err.message}`);
        }
      }

      if (messagesToSave.length > 0) {
        // 批量保存到数据库
        await this.chatMessageRepository.save(messagesToSave);
        this.logger.log(`成功保存 ${messagesToSave.length} 条消息到数据库`);

        // 清空待处理队列
        await this.redis.del(this.REDIS_PENDING_KEY);
      }
    } catch (error) {
      this.logger.error(`批量保存消息失败: ${error.message}`);
    }
  }

  /**
   * 删除在线用户
   * @param leaveUser
   */
  delOnlineUser(leaveUser: OnlineUser) {
    if (!leaveUser) return;
    this.onlineUsers.userQueue = this.onlineUsers.userQueue?.filter((item) => {
      return item.onlineUser.id !== leaveUser.onlineUser.id;
    });
  }

  /**
   * 从数据库加载历史消息
   */
  private async loadHistoryMessages() {
    try {
      const messages = await this.chatMessageRepository.find({
        relations: ['user'],
        order: { createTime: 'ASC' },
      });

      if (messages && messages.length > 0) {
        // 将数据库中的消息转换为ChartMessage格式
        const dbMessages = messages.map((msg) => ({
          user: msg.user,
          msg: msg.msg,
          id: msg.socketId || '',
        }));

        this.chartMessageList = dbMessages;
      }
    } catch (error) {
      console.error('加载历史消息失败:', error);
    }
  }

  /**
   * 合并消息，避免重复
   * @param newMessages
   */
  private mergeMessages(newMessages: ChartMessage[]) {
    if (!newMessages || newMessages.length === 0) return;

    // 使用Map来去重，以消息内容和用户ID作为唯一标识
    const messageMap = new Map();

    // 先添加已有消息
    this.chartMessageList.forEach((msg) => {
      const key = `${msg.user.id}-${msg.msg}`;
      messageMap.set(key, msg);
    });

    // 添加新消息
    newMessages.forEach((msg) => {
      const key = `${msg.user.id}-${msg.msg}`;
      if (!messageMap.has(key)) {
        messageMap.set(key, msg);
      }
    });

    // 转换回数组
    this.chartMessageList = Array.from(messageMap.values());
  }
}
