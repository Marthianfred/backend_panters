import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class ReactToPostDto {
  @ApiProperty({
    description: 'ID de la publicación (muro) a la que se reacciona',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty({ message: 'El id del post es obligatorio' })
  postId: string;
}

export class PostReactionResponse {
  @ApiProperty({ description: 'Indica si la acción fue exitosa' })
  success: boolean;

  @ApiProperty({ description: 'Total acumulado de Panteras en este post' })
  totalPanteras: number;

  @ApiProperty({ description: 'Mensaje de confirmación' })
  message: string;
}

export interface PostReactionEvent {
  postId: string;
  userId: string;
  creatorId: string;
  type: 'pantera';
  timestamp: Date;
}
