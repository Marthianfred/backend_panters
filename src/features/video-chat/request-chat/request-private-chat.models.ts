export class RequestPrivateChatDto {
  creatorId: string;
  durationMinutes: number;
}

export interface RequestPrivateChatResponse {
  sessionId: string;
  streamId: string;
  channelArn: string;
  signalingEndpoint: string;
  credentials: any;
}
