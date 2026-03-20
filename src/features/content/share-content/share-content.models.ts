import { ApiProperty } from '@nestjs/swagger';

export class ShareInfoResponse {
  @ApiProperty({ description: 'Metadatos públicos del contenido' })
  content: {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    type: string;
    price: number;
    accessType: string;
  };

  @ApiProperty({ description: 'Metadatos de la creadora' })
  creator: {
    id: string;
    fullName: string;
    avatarUrl: string;
    isOnline: boolean;
  };

  @ApiProperty({ description: 'Estado de acceso para el usuario actual' })
  accessStatus: {
    isLoggedIn: boolean;
    isSubscribed: boolean;
    isPurchased: boolean;
    canView: boolean;
    requiredAction: 'NONE' | 'LOGIN' | 'SUBSCRIBE' | 'BUY_COINS' | 'BUY_CONTENT';
  };
}
