/**
 * DTO para la respuesta del ranking de creadoras.
 */
export class CreatorRankingResponse {
  /** ID del usuario creador */
  userId!: string;
  
  /** Nombre de usuario (@handle) */
  username!: string;
  
  /** Nombre completo para mostrar */
  fullName!: string;
  
  /** URL de la imagen de perfil */
  avatarUrl?: string;
  
  /** Cantidad total de reacciones acumuladas en todos sus posts */
  totalReactions!: number;
  
  /** Rating calculado (en este sistema, equivalente al score de reacciones) */
  rating!: number;
}
