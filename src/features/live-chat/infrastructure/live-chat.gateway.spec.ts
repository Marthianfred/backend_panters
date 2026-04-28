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
    };

    mockSocket = {
      id: 'socket-id',
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      handshake: {
        headers: {},
      },
    } as any;

    mockLiveChatService = {
      createMessagePayload: jest.fn().mockImplementation((_, data) => ({
        id: data.id || 'test-id',
        username: data.username,
        text: data.text,
        time: new Date().toISOString(),
        isGift: false,
      })),
      createGiftPayload: jest.fn().mockImplementation((_, username, giftName, iconUrl, giftId) => ({
        id: 'test-gift-id',
        username,
        text: `¡Envió un ${giftName}!`,
        time: '12:00',
        isGift: true,
        giftType: giftId || giftName,
        iconUrl,
      })),
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

  it('should join a live room', () => {
    const creatorId = 'creator-1';
    gateway.handleJoinLive({ creatorId }, mockSocket as Socket);
    expect(mockSocket.join).toHaveBeenCalledWith(`live_${creatorId}`);
  });

  it('should leave a live room', () => {
    const creatorId = 'creator-1';
    gateway.handleLeaveLive({ creatorId }, mockSocket as Socket);
    expect(mockSocket.leave).toHaveBeenCalledWith(`live_${creatorId}`);
  });

  it('should broadcast a chat message to the correct room', async () => {
    const creatorId = 'creator-1';
    const username = '@freddy';
    const text = 'Hello world';

    await gateway.handleSendMessage({ creatorId, username, text }, mockSocket as Socket);

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
