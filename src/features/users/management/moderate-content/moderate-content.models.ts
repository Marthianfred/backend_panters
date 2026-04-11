import { IsEnum } from 'class-validator';

export enum ModerationAction {
  ARCHIVE = 'archived',
  BLOCK = 'blocked'
}

export class ModerateContentRequest {
  @IsEnum(ModerationAction)
  action!: ModerationAction;
}
