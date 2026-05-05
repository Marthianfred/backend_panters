export class EndPrivateChatDto {
  reason?: string;
}

export interface EndPrivateChatResponse {
  sessionId: string;
  status: string;
  endedAt: Date;
}
