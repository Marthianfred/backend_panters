import { WebRTCCredentials } from '../get-viewer-access/get-viewer-access.models';

export interface CreateStreamRequest {
  creatorId: string;
  title: string;
}

export interface CreateStreamResponse {
  streamId: string;
  channelArn: string;
  region: string;
  credentials: WebRTCCredentials;
}
