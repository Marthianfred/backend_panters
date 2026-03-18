import { PostReactionEvent } from '../post-reactions.models';

export const POST_REACTION_EVENT_PUBLISHER_TOKEN = Symbol('IPostReactionEventPublisher');

export interface IPostReactionEventPublisher {
  /**
   * Comunica la nueva reacción al sistema de Rating a través de flujos de datos.
   */
  publish(event: PostReactionEvent): Promise<void>;
}
