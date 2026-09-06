import { registerEnumType } from '@nestjs/graphql';

export enum PlayActionType {
  Dribble = 'dribble',
  Pass = 'pass',
  Cut = 'cut',
  Screen = 'screen',
  Shot = 'shot',
  Handoff = 'handoff',
}

export enum PlayObjectKind {
  Offense = 'offense',
  Defense = 'defense',
}

export enum CourtType {
  Half = 'half',
  Full = 'full',
}

registerEnumType(PlayActionType, { name: 'PlayActionType' });
registerEnumType(PlayObjectKind, { name: 'PlayObjectKind' });
registerEnumType(CourtType, { name: 'CourtType' });
