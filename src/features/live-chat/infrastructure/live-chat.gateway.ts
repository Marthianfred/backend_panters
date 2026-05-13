import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LiveChatService } from '../application/live-chat.service';

interface LiveChatSocketData {
  creatorId?: string;
}

@WebSocketGateway({
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class LiveChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly liveChatService: LiveChatService) {}

  handleConnection(client: Socket) {
    console.log(`Cliente conectado al Live Chat WS: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const socketData = client.data as LiveChatSocketData;
    const creatorId = socketData.creatorId;
    if (creatorId) {
      this.updateViewerCount(creatorId);
    }
    console.log(`Cliente desconectado del Live Chat WS: ${client.id}`);
  }

  @SubscribeMessage('joinLive')
  handleJoinLive(
    @MessageBody() data: { creatorId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `live_${data.creatorId}`;
    void client.join(room);
    const socketData = client.data as LiveChatSocketData;
    socketData.creatorId = data.creatorId;
    this.updateViewerCount(data.creatorId);
    console.log(`Cliente ${client.id} se unió a la sala: ${room}`);
  }

  @SubscribeMessage('leaveLive')
  handleLeaveLive(
    @MessageBody() data: { creatorId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `live_${data.creatorId}`;
    void client.leave(room);
    const socketData = client.data as LiveChatSocketData;
    delete socketData.creatorId;
    this.updateViewerCount(data.creatorId);
    console.log(`Cliente ${client.id} abandonó la sala: ${room}`);
  }

  private updateViewerCount(creatorId: string) {
    const room = `live_${creatorId}`;
    const count = this.server.sockets.adapter.rooms.get(room)?.size || 0;
    this.server.to(room).emit('viewerCount', { count });
  }

  @SubscribeMessage('sendChatMessage')
  async handleSendMessage(
    @MessageBody()
    data: {
      creatorId: string;
      username: string;
      text: string;
      id?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `live_${data.creatorId}`;
    const messagePayload = await this.liveChatService.createMessagePayload(
      client,
      data,
    );

    this.server.to(room).emit('receiveChatMessage', messagePayload);
  }

  @SubscribeMessage('sendGiftAnimation')
  async handleSendGiftAnimation(
    @MessageBody()
    data: {
      creatorId: string;
      username: string;
      giftName: string;
      iconUrl?: string;
      giftId?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    await this.broadcastGift(
      data.creatorId,
      data.username,
      data.giftName,
      data.iconUrl,
      data.giftId,
      client,
    );
  }

  async broadcastGift(
    creatorId: string,
    username: string,
    giftName: string,
    iconUrl?: string,
    giftId?: string,
    client: Socket | null = null,
  ) {
    const room = `live_${creatorId}`;
    const giftPayload = await this.liveChatService.createGiftPayload(
      client,
      username,
      giftName,
      iconUrl,
      giftId,
    );

    this.server.to(room).emit('receiveChatMessage', giftPayload);
    this.server.to(room).emit('receiveGiftAnimation', {
      name: giftName,
      icon: iconUrl || giftId,
      username: giftPayload.username,
    });
  }

  notifyPrivateChatRequest(creatorId: string, data: Record<string, unknown>) {
    const room = `live_${creatorId}`;
    this.server.to(room).emit('privateChatRequest', data);
  }
}
