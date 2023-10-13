import { Injectable } from '@nestjs/common';
import { Profile } from '../user/entity/profile.entity';

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
}

@Injectable()
export class ChatService {
  onlineUsers: OnlineUsers;
  userOnlineList: Array<OnlineUser> = [];
  chartMessageList: Array<ChartMessage> = [];

  constructor() {
    this.onlineUsers = {
      userQueue: [],
      currentUser: null,
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
    return receiveMsg;
  }

  /**
   * 删除在线用户
   * @param leaveUser
   */
  delOnlineUser(leaveUser: OnlineUser) {
    if (!leaveUser) return;
    this.onlineUsers.userQueue = this.onlineUsers.userQueue.filter((item) => {
      return item.onlineUser.id !== leaveUser.onlineUser.id;
    });
  }
}
