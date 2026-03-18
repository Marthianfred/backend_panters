export const POST_REACTION_REPOSITORY_TOKEN = Symbol('IPostReactionRepository');

export interface IPostReactionRepository {
  /**
   * Registra una reacción 'pantera' del usuario a un post.
   * Si ya existe, es tratada como idempotente.
   * Retorna el nuevo conteo total de panteras para ese post.
   */
  upsertReaction(userId: string, postId: string): Promise<number>;

  /**
   * Obtiene el ID del creador (user.id) del post a través de content_items.
   */
  getPostOwnerId(postId: string): Promise<string | null>;

  /**
   * Verifica la existencia del post para evitar reacciones huérfanas.
   */
  postExists(postId: string): Promise<boolean>;
}
