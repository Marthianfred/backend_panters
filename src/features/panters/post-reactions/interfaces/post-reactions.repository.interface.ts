export const POST_REACTION_REPOSITORY_TOKEN = Symbol('IPostReactionRepository');

export interface IPostReactionRepository {
  
  upsertReaction(userId: string, postId: string): Promise<number>;

  
  getPostOwnerId(postId: string): Promise<string | null>;

  
  postExists(postId: string): Promise<boolean>;
}
