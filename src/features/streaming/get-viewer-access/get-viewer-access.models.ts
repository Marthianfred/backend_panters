export interface GetViewerAccessRequest {
  streamId: string;
  userId: string;
}

export interface WebRTCCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: Date;
}

export interface GetViewerAccessResponse {
  channelArn: string;
  region: string;
  signalingEndpoint: string;
  thumbnailUrl: string;
  credentials: WebRTCCredentials;
}

export class StreamNotFoundError extends Error {
  constructor(streamId: string) {
    super(`El stream con ID ${streamId} no fue encontrado o no está activo.`);
    this.name = 'StreamNotFoundError';
  }
}
