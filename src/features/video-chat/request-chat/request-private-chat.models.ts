export class RequestPrivateChatDto {
  creatorId: string;
  durationMinutes: number;
}

export interface RequestPrivateChatResponse {
  sessionId: string;
  streamId: string;
  channelArn: string;
  signalingEndpoint: string;
  credentials: Record<string, unknown>;
  iceServers?: unknown[];
}
