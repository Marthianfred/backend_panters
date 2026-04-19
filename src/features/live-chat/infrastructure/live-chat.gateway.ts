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
  handleSendMessage(
    @MessageBody()
    data: {
      creatorId: string;
      username: string;
      text: string;
      id?: string;
    },
  ) {
    const room = `live_${data.creatorId}`;
    const messagePayload = {
      id: data.id || Date.now().toString(),
      username: data.username,
      text: data.text,
      time: new Date().toISOString(),
      isGift: false,
    };

    this.server.to(room).emit('receiveChatMessage', messagePayload);
  }


  @SubscribeMessage('sendGiftAnimation')
  handleSendGiftAnimation(
    @MessageBody()
    data: {
      creatorId: string;
      username: string;
      giftName: string;
      iconUrl?: string;
      giftId?: string;
    },
  ) {
    this.broadcastGift(
      data.creatorId,
      data.username,
      data.giftName,
      data.iconUrl,
      data.giftId,
    );
  }

  broadcastGift(
    creatorId: string,
    username: string,
    giftName: string,
    iconUrl?: string,
    giftId?: string,
  ) {
    const room = `live_${creatorId}`;
    const giftPayload = {
      id: Date.now().toString(),
      username: username,
      text: `¡Envió un ${giftName}! ${iconUrl === 'rose' ? '🌹' : iconUrl === 'diamond' ? '💎' : '🎁'}`,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      isGift: true,
      giftType: giftId || giftName,
      iconUrl,
    };

    this.server.to(room).emit('receiveChatMessage', giftPayload);
    this.server.to(room).emit('receiveGiftAnimation', {
      name: giftName,
      icon: iconUrl || giftId,
    });
  }
}

