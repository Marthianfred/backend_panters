import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import type {
  IVideoChatRepository,
  VideoCallSession,
} from '../interfaces/video-chat.repository.interface';
import { VIDEO_CHAT_REPOSITORY } from '../interfaces/video-chat.repository.interface';
import { LiveChatGateway } from '../../live-chat/infrastructure/live-chat.gateway';
import { EndPrivateChatHandler } from '../end-chat/end-private-chat.handler';

@Injectable()
export class StartPrivateChatHandler {
  private readonly logger = new Logger(StartPrivateChatHandler.name);

  constructor(
    @Inject(VIDEO_CHAT_REPOSITORY)
    private readonly repository: IVideoChatRepository,
    private readonly liveChatGateway: LiveChatGateway,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly endHandler: EndPrivateChatHandler,
  ) {}

  async execute(userId: string, sessionId: string) {
    const session = await this.repository.getSessionById(sessionId);

    if (!session) {
      throw new NotFoundException('Sesión de chat privado no encontrada.');
    }

    const isCreator = session.creatorId === userId;
    const isClient = session.userId === userId;

    if (!isCreator && !isClient) {
      throw new ForbiddenException(
        'No tienes permiso para iniciar este chat privado.',
      );
    }

    if (session.status === 'completed' || session.status === 'canceled') {
      throw new BadRequestException('Esta sesión ya ha finalizado.');
    }

    // Notificar que este usuario se ha unido
    const role = isCreator ? 'MASTER' : 'VIEWER';
    this.liveChatGateway.server
      .to(`live_${session.creatorId}`)
      .emit('userJoinedPrivate', {
        sessionId: session.id,
        userId,
        role,
      });

    // Lógica de inicio del temporizador si es el primer inicio
    this.manageTimer(session);

    return {
      sessionId: session.id,
      status: session.status,
      startTime: new Date(),
    };
  }

  private manageTimer(session: VideoCallSession) {
    const timerName = `timer_${session.id}`;

    try {
      // Si ya existe el temporizador, no hacemos nada (ya está corriendo)
      this.schedulerRegistry.getTimeout(timerName);
      return;
    } catch {
      // Si no existe, lo creamos
      const durationMs = session.durationMinutes * 60 * 1000;
      let remainingSeconds = session.durationMinutes * 60;

      this.logger.log(
        `Iniciando temporizador para sesión ${session.id}: ${session.durationMinutes} min`,
      );

      // Intervalo para enviar actualizaciones de tiempo cada segundo
      const intervalName = `interval_${session.id}`;
      const interval = setInterval(() => {
        remainingSeconds--;

        this.liveChatGateway.server
          .to(`live_${session.creatorId}`)
          .emit('timeRemaining', {
            sessionId: session.id,
            remainingSeconds,
          });

        if (remainingSeconds <= 0) {
          clearInterval(interval);
          try {
            this.schedulerRegistry.deleteInterval(intervalName);
          } catch {
            // Ignorar
          }
        }
      }, 1000);

      this.schedulerRegistry.addInterval(intervalName, interval);

      // Timeout para finalizar la llamada automáticamente
      const timeout = setTimeout(() => {
        this.logger.log(
          `Tiempo agotado para sesión ${session.id}. Finalizando...`,
        );
        this.endHandler
          .execute(session.creatorId, session.id, {
            reason: 'Tiempo agotado',
          })
          .catch((error: unknown) => {
            const message =
              error instanceof Error ? error.message : String(error);
            this.logger.error(
              `Error al finalizar sesión ${session.id} por tiempo: ${message}`,
            );
          })
          .finally(() => {
            try {
              this.schedulerRegistry.deleteTimeout(timerName);
            } catch {
              // Ignorar
            }
          });
      }, durationMs);

      this.schedulerRegistry.addTimeout(timerName, timeout);
    }
  }
}
