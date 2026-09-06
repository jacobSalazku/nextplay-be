import { registerEnumType } from '@nestjs/graphql';

export enum PlayActionType {
  dribble = 'dribble',
  pass = 'pass',
  cut = 'cut',
  screen = 'screen',
  shot = 'shot',
  handoff = 'handoff',
}

export enum PlayObjectKind {
  offense = 'offense',
  defense = 'defense',
}

export enum CourtType {
  half = 'half',
  full = 'full',
}

registerEnumType(PlayActionType, { name: 'PlayActionType' });
registerEnumType(PlayObjectKind, { name: 'PlayObjectKind' });
registerEnumType(CourtType, { name: 'CourtType' });
