import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: true,
})
export class ChatGateway implements OnGatewayInit, OnGatewayDisconnect {
  constructor(private readonly chatService: ChatService) {}

  @WebSocketServer()
  server: Server;

  // 初始化
  afterInit() {
    console.log('websocket 初始化成功！');
  }

  /**
   * 断开连接
   * @param client
   */
  handleDisconnect(client: Socket) {
    const leaveUser = this.chatService.onlineUsers.userQueue.find(
      (item) => item.id === client.id,
    );
    if (leaveUser) {
      this.chatService.delOnlineUser(leaveUser);
      this.server.emit('userFadeOut', leaveUser);
      this.chatService.onlineUsers.trigger = 'fadeOut';
      this.server.emit('users', this.chatService.onlineUsers);
      console.log(leaveUser?.onlineUser.name, '断开连接');
    }
  }

  @SubscribeMessage('userFadeIn')
  userFadeIn(
    @MessageBody() body: any,
    @ConnectedSocket() client: Socket,
  ): void {
    const onlineUsers = this.chatService.countOnlineUser({
      id: client.id,
      onlineUser: body.user,
      status: '在线',
    });
    this.chatService.onlineUsers.trigger = 'fadeIn';
    // 找到当前用户为传入的用户
    onlineUsers.currentUser = onlineUsers.userQueue.find(
      (item) => item.onlineUser.id === body.user.id,
    );
    this.server.emit('users', onlineUsers);
    this.server.emit('chartMsg', this.chatService.chartMessageList);
  }

  @SubscribeMessage('chartMsg')
  chartMsg(@MessageBody() body: any, @ConnectedSocket() client: Socket): void {
    const chartMessage = this.chatService.saveChartMessage({
      id: client.id,
      ...body,
    });
    this.server.emit('chartMsg', chartMessage);
  }
}
