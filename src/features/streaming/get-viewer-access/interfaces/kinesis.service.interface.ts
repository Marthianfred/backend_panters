import { WebRTCCredentials } from '../get-viewer-access.models';

export const KINESIS_VIDEO_SERVICE = Symbol('IKinesisVideoService');

export interface IKinesisVideoService {
  generateViewerCredentials(
    channelArn: string,
    userId: string,
  ): Promise<WebRTCCredentials>;
  createSignalingChannel(channelName: string): Promise<string>; // Retorna el ARN
}
