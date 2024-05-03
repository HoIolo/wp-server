import { Inject, Injectable } from '@nestjs/common';
import { Profile } from '../user/entity/profile.entity';
import { Redis } from 'ioredis';

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

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {
    this.redis.lrange(this.REDIS_CHAT_KEY, 0, -1, (err, chatMessage) => {
      if (err) {
        console.log(err);
      }
      if (chatMessage) {
        this.chartMessageList = chatMessage.map((item) => {
          return JSON.parse(item);
        });
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
  saveChartMessage(receiveMsg: ChartMessage) {
    this.chartMessageList.push(receiveMsg);
    this.redis.rpush(this.REDIS_CHAT_KEY, JSON.stringify(receiveMsg));
    return receiveMsg;
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
}
