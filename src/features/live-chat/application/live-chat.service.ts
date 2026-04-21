import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { fromNodeHeaders } from 'better-auth/node';
import { AuthService } from '../../auth/application/auth.service';
import { PostgresUsersManagementRepository } from '../../users/management/infrastructure/postgres.users-management.repository';

export interface ChatMessagePayload {
  id: string;
  username: string;
  text: string;
  time: string;
  isGift: boolean;
  giftType?: string;
  iconUrl?: string;
}

@Injectable()
export class LiveChatService {
  constructor(
    private readonly authService: AuthService,
    private readonly usersRepository: PostgresUsersManagementRepository,
  ) {}

  /**
   * Crea el payload para un mensaje de chat estándar.
   * Resuelve el nombre del usuario de forma segura.
   */
  async createMessagePayload(
    client: Socket,
    data: { username: string; text: string; id?: string },
  ): Promise<ChatMessagePayload> {
    const username = await this.resolveUserIdentifier(client, data.username);

    return {
      id: data.id || Date.now().toString(),
      username,
      text: data.text,
      time: new Date().toISOString(),
      isGift: false,
    };
  }

  /**
   * Crea el payload para una notificación de regalo.
   */
  async createGiftPayload(
    client: Socket | null,
    username: string,
    giftName: string,
    iconUrl?: string,
    giftId?: string,
  ): Promise<ChatMessagePayload> {
    // Si tenemos el socket del cliente, intentamos resolver su identidad real
    const finalUsername = client 
      ? await this.resolveUserIdentifier(client, username)
      : username;

    return {
      id: Date.now().toString(),
      username: finalUsername,
      text: `¡Envió un ${giftName}! ${
        iconUrl === 'rose' ? '🌹' : iconUrl === 'diamond' ? '💎' : '🎁'
      }`,
      time: new Date().toISOString(),
      isGift: true,
      giftType: giftId || giftName,
      iconUrl,
    };
  }

  /**
   * Intenta identificar al usuario a través de la sesión de Better Auth y la base de datos.
   * Prioriza el handle (@username) sobre el nombre completo (name).
   */
  private async resolveUserIdentifier(client: Socket, providedUsername: string): Promise<string> {
    try {
      // 1. Obtener la sesión básica desde Better Auth
      const sessionResponse = await this.authService.instance.api.getSession({
        headers: fromNodeHeaders(client.handshake.headers as any),
      });

      if (sessionResponse?.user) {
        // 2. Consultar detalles completos en la base de datos (fuente de verdad)
        // El objeto de sesión de Better Auth puede no estar sincronizado con campos adicionales.
        const userDetails = await this.usersRepository.getUserDetails(sessionResponse.user.id);
        
        if (userDetails) {
          // 3. Resolución de nombre con jerarquía de prioridad:
          // A. displayUsername (si el usuario eligió uno personalizado)
          if (userDetails.displayUsername && userDetails.displayUsername.trim() !== '') {
            return userDetails.displayUsername;
          }

          // B. username (handle del sistema con prefijo @)
          if (userDetails.username && userDetails.username.trim() !== '') {
             const handle = userDetails.username.startsWith('@') 
               ? userDetails.username 
               : `@${userDetails.username}`;
             return handle;
          }

          // C. name (nombre completo del perfil)
          return userDetails.name || providedUsername || 'Usuario';
        }
      }
    } catch (error) {
      console.warn('[LiveChatService] Error al recuperar identidad del usuario:', error.message);
    }

    // Fallback al valor enviado por el cliente o genérico si no hay sesión
    return providedUsername && providedUsername !== '' ? providedUsername : 'Usuario';
  }
}
