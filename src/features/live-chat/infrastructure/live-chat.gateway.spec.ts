import { Test, TestingModule } from '@nestjs/testing';
import { LiveChatGateway } from './live-chat.gateway';
import { LiveChatService } from '../application/live-chat.service';
import { AuthService } from '../../auth/application/auth.service';
import { Server, Socket } from 'socket.io';

jest.mock('better-auth/node', () => ({
  fromNodeHeaders: jest.fn(),
  toNodeHandler: jest.fn(),
}));

describe('LiveChatGateway', () => {
  let gateway: LiveChatGateway;
  let mockServer: Partial<Server>;
  let mockSocket: Partial<Socket>;
  let mockLiveChatService: Partial<LiveChatService>;

  beforeEach(async () => {
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      sockets: {
        adapter: {
          rooms: new Map<string, { size: number }>(),
        },
      },
    } as unknown as Server;

    mockSocket = {
      id: 'socket-id',
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      data: {} as Record<string, unknown>,
      handshake: {
        headers: {},
      },
    } as unknown as Socket;

    mockLiveChatService = {
      createMessagePayload: jest
        .fn()
        .mockImplementation(
          (_, data: { id?: string; username: string; text: string }) => ({
            id: data.id || 'test-id',
            username: data.username,
            text: data.text,
            time: new Date().toISOString(),
            isGift: false,
          }),
        ),
      createGiftPayload: jest
        .fn()
        .mockImplementation(
          (
            _,
            username: string,
            giftName: string,
            iconUrl: string,
            giftId?: string,
          ) => ({
            id: 'test-gift-id',
            username,
            text: `¡Envió un ${giftName}!`,
            time: '12:00',
            isGift: true,
            giftType: giftId || giftName,
            iconUrl,
          }),
        ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LiveChatGateway,
        { provide: LiveChatService, useValue: mockLiveChatService },
        { provide: AuthService, useValue: {} },
      ],
    }).compile();

    gateway = module.get<LiveChatGateway>(LiveChatGateway);
    gateway.server = mockServer as Server;
  });

  it('should join a live room and update viewer count', () => {
    const creatorId = 'creator-1';
    const room = `live_${creatorId}`;
    const roomsMap = mockServer.sockets!.adapter.rooms as Map<
      string,
      { size: number }
    >;
    roomsMap.set(room, { size: 1 });

    gateway.handleJoinLive({ creatorId }, mockSocket as Socket);

    expect(mockSocket.join).toHaveBeenCalledWith(room);
    const socketData = mockSocket.data as { creatorId?: string };
    expect(socketData.creatorId).toBe(creatorId);
    expect(mockServer.to).toHaveBeenCalledWith(room);
    expect(mockServer.emit).toHaveBeenCalledWith('viewerCount', { count: 1 });
  });

  it('should leave a live room and update viewer count', () => {
    const creatorId = 'creator-1';
    const room = `live_${creatorId}`;
    const roomsMap = mockServer.sockets!.adapter.rooms as Map<
      string,
      { size: number }
    >;
    roomsMap.set(room, { size: 0 });

    gateway.handleLeaveLive({ creatorId }, mockSocket as Socket);

    expect(mockSocket.leave).toHaveBeenCalledWith(room);
    const socketData = mockSocket.data as { creatorId?: string };
    expect(socketData.creatorId).toBeUndefined();
    expect(mockServer.to).toHaveBeenCalledWith(room);
    expect(mockServer.emit).toHaveBeenCalledWith('viewerCount', { count: 0 });
  });

  it('should update viewer count on disconnect if in a live room', () => {
    const creatorId = 'creator-1';
    const room = `live_${creatorId}`;
    const socketData = mockSocket.data as { creatorId?: string };
    socketData.creatorId = creatorId;

    const roomsMap = mockServer.sockets!.adapter.rooms as Map<
      string,
      { size: number }
    >;
    roomsMap.set(room, { size: 2 });

    gateway.handleDisconnect(mockSocket as Socket);

    expect(mockServer.to).toHaveBeenCalledWith(room);
    expect(mockServer.emit).toHaveBeenCalledWith('viewerCount', { count: 2 });
  });

  it('should broadcast a chat message to the correct room', async () => {
    const creatorId = 'creator-1';
    const username = '@freddy';
    const text = 'Hello world';

    await gateway.handleSendMessage(
      { creatorId, username, text },
      mockSocket as Socket,
    );

    expect(mockServer.to).toHaveBeenCalledWith(`live_${creatorId}`);
    expect(mockServer.emit).toHaveBeenCalledWith(
      'receiveChatMessage',
      expect.objectContaining({
        username,
        text,
        isGift: false,
      }),
    );
  });

  it('should broadcast gift animation and message', async () => {
    const creatorId = 'creator-1';
    const username = '@freddy';
    const giftName = 'Rosa Panter';
    const iconUrl = 'rose';

    await gateway.handleSendGiftAnimation(
      { creatorId, username, giftName, iconUrl },
      mockSocket as Socket,
    );

    expect(mockServer.to).toHaveBeenCalledWith(`live_${creatorId}`);
    expect(mockServer.emit).toHaveBeenCalledWith(
      'receiveChatMessage',
      expect.objectContaining({
        username,
        isGift: true,
      }),
    );
    expect(mockServer.emit).toHaveBeenCalledWith('receiveGiftAnimation', {
      name: giftName,
      icon: iconUrl,
      username: username,
    });
  });
});
