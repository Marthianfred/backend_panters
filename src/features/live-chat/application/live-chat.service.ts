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

  
  async createGiftPayload(
    client: Socket | null,
    username: string,
    giftName: string,
    iconUrl?: string,
    giftId?: string,
  ): Promise<ChatMessagePayload> {
    
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

  
  private async resolveUserIdentifier(client: Socket, providedUsername: string): Promise<string> {
    try {
      
      const sessionResponse = await this.authService.instance.api.getSession({
        headers: fromNodeHeaders(client.handshake.headers as any),
      });

      if (sessionResponse?.user) {
        
        
        const userDetails = await this.usersRepository.getUserDetails(sessionResponse.user.id);
        
        if (userDetails) {
          
          
          if (userDetails.displayUsername && userDetails.displayUsername.trim() !== '') {
            return userDetails.displayUsername;
          }

          
          if (userDetails.username && userDetails.username.trim() !== '') {
             const handle = userDetails.username.startsWith('@') 
               ? userDetails.username 
               : `@${userDetails.username}`;
             return handle;
          }

          
          return userDetails.name || providedUsername || 'Usuario';
        }
      }
    } catch (error) {
      console.warn('[LiveChatService] Error al recuperar identidad del usuario:', error.message);
    }

    
    return providedUsername && providedUsername !== '' ? providedUsername : 'Usuario';
  }
}
