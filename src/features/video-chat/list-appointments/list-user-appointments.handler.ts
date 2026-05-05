import { Injectable, Inject } from '@nestjs/common';
import type {
  IVideoChatRepository,
  VideoCallSession,
} from '../interfaces/video-chat.repository.interface';
import { VIDEO_CHAT_REPOSITORY } from '../interfaces/video-chat.repository.interface';
import { PostgresUsersManagementRepository } from '../../users/management/infrastructure/postgres.users-management.repository';

@Injectable()
export class ListUserAppointmentsHandler {
  constructor(
    @Inject(VIDEO_CHAT_REPOSITORY)
    private readonly repository: IVideoChatRepository,
    private readonly usersRepository: PostgresUsersManagementRepository,
  ) {}

  async execute(userId: string) {
    const appointments = await this.repository.getUserSessions(userId);

    const result = await Promise.all(
      appointments.map(async (app) => {
        const otherUserId = app.userId === userId ? app.creatorId : app.userId;
        const otherUser =
          await this.usersRepository.getUserDetails(otherUserId);

        return {
          id: app.id,
          panterName:
            otherUser?.displayUsername || otherUser?.name || 'Usuario',
          avatarUrl: otherUser?.profile?.avatarUrl || null,
          type: '1-on-1 Video Call',
          date: app.scheduleTime.toISOString().split('T')[0],
          time: app.scheduleTime.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          status: this.mapStatus(app.status),
          durationMinutes: app.durationMinutes,
        };
      }),
    );

    return result;
  }

  private mapStatus(status: VideoCallSession['status']) {
    switch (status) {
      case 'accepted':
        return 'ACTIVE - READY';
      case 'pending':
        return 'SCHEDULED';
      case 'completed':
        return 'COMPLETED';
      case 'canceled':
        return 'CANCELLED';
      default:
        return 'SCHEDULED';
    }
  }
}
