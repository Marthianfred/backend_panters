import { Test, TestingModule } from '@nestjs/testing';
import { LiveChatGateway } from './live-chat.gateway';
import { Server, Socket } from 'socket.io';

describe('LiveChatGateway', () => {
  let gateway: LiveChatGateway;
  let mockServer: Partial<Server>;
  let mockSocket: Partial<Socket>;

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
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [LiveChatGateway],
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

  it('should broadcast a chat message to the correct room', () => {
    const creatorId = 'creator-1';
    const username = '@freddy';
    const text = 'Hello world';

    gateway.handleSendMessage({ creatorId, username, text });

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

  it('should broadcast gift animation and message', () => {
    const creatorId = 'creator-1';
    const username = '@freddy';
    const giftName = 'Rosa Panter';
    const iconUrl = 'rose';

    gateway.handleSendGiftAnimation({ creatorId, username, giftName, iconUrl });

    expect(mockServer.to).toHaveBeenCalledWith(`live_${creatorId}`);
    expect(mockServer.emit).toHaveBeenCalledWith(
      'receiveChatMessage',
      expect.objectContaining({
        username,
        isGift: true,
        text: expect.stringContaining(giftName),
      }),
    );
    expect(mockServer.emit).toHaveBeenCalledWith('receiveGiftAnimation', {
      name: giftName,
      icon: iconUrl,
    });
  });
});
