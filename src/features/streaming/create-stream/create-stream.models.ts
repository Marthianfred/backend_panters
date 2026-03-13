export interface CreateStreamRequest {
  creatorId: string;
  title: string;
}

export interface CreateStreamResponse {
  streamId: string;
  channelArn: string;
  region: string;
}
