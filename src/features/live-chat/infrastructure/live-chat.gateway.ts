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
    console.log(`Cliente desconectado del Live Chat WS: ${client.id}`);
  }

  @SubscribeMessage('joinLive')
  handleJoinLive(
    @MessageBody() data: { creatorId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `live_${data.creatorId}`;
    void client.join(room);
    console.log(`Cliente ${client.id} se unió a la sala: ${room}`);
  }

  @SubscribeMessage('leaveLive')
  handleLeaveLive(
    @MessageBody() data: { creatorId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `live_${data.creatorId}`;
    void client.leave(room);
    console.log(`Cliente ${client.id} abandonó la sala: ${room}`);
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
    const messagePayload = await this.liveChatService.createMessagePayload(client, data);

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
}

