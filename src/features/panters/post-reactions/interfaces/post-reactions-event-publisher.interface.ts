import { PostReactionEvent } from '../post-reactions.models';

export const POST_REACTION_EVENT_PUBLISHER_TOKEN = Symbol('IPostReactionEventPublisher');

export interface IPostReactionEventPublisher {
  
  publish(event: PostReactionEvent): Promise<void>;
}
