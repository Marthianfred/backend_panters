import { Module } from '@nestjs/common';
import { LiveChatGateway } from './infrastructure/live-chat.gateway';

@Module({
  providers: [LiveChatGateway],
  exports: [LiveChatGateway],
})
export class LiveChatModule {}
