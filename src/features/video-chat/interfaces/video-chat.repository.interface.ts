import { CreateStreamResponse } from '../../streaming/create-stream/create-stream.models';

export interface VideoCallSession {
  id: string;
  creatorId: string;
  userId: string;
  scheduleTime: Date;
  durationMinutes: number;
  priceCoins: number;
  status: 'pending' | 'accepted' | 'completed' | 'canceled';
  streamId?: string;
  channelArn?: string;
}

export interface IVideoChatRepository {
  createSession(session: Partial<VideoCallSession>): Promise<VideoCallSession>;
  getSessionById(id: string): Promise<VideoCallSession | null>;
  updateSessionStatus(id: string, status: VideoCallSession['status']): Promise<void>;
  updateSessionStream(id: string, streamId: string, channelArn: string): Promise<void>;
  processPayment(userId: string, creatorId: string, amount: number, description: string): Promise<{ transactionId: string; remainingBalance: number } | null>;
  userExists(userId: string): Promise<boolean>;
}

export const VIDEO_CHAT_REPOSITORY = Symbol('IVideoChatRepository');
