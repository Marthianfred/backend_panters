import { WebRTCCredentials } from '../get-viewer-access.models';

export const KINESIS_VIDEO_SERVICE = Symbol('IKinesisVideoService');

export interface IKinesisVideoService {
  generateViewerCredentials(
    channelArn: string,
    userId: string,
  ): Promise<WebRTCCredentials>;
  generateProducerCredentials(
    channelArn: string,
    userId: string,
  ): Promise<WebRTCCredentials>;
  getSignalingEndpoint(
    channelArn: string,
    role: 'MASTER' | 'VIEWER',
  ): Promise<string>;
  getIceServers(
    channelArn: string,
    credentials: WebRTCCredentials,
    role: 'MASTER' | 'VIEWER',
  ): Promise<unknown[]>;
  createSignalingChannel(channelName: string): Promise<string>;
}
