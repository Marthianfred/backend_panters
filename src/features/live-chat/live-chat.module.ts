import { Module } from '@nestjs/common';
import { LiveChatGateway } from './infrastructure/live-chat.gateway';
import { LiveChatService } from './application/live-chat.service';
import { UsersManagementModule } from '../users/management/users-management.module';

@Module({
  imports: [UsersManagementModule],
  providers: [LiveChatGateway, LiveChatService],
  exports: [LiveChatGateway, LiveChatService],
})
export class LiveChatModule {}
