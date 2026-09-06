import { CourtType, PlayObjectKind } from './play.enums';
import type { PlacedObject } from './play-diagram.schema';

export type FormationPreset = {
  id: string;
  name: string;
  court: CourtType;
  objects: PlacedObject[];
};

const off = (label: string, x: number, y: number): PlacedObject => ({
  id: `o${label}`,
  kind: PlayObjectKind.Offense,
  label,
  x,
  y,
});

export const FORMATION_PRESETS: FormationPreset[] = [
  {
    id: '5-out',
    name: '5-Out',
    court: CourtType.Half,
    objects: [
      off('1', 50, 82),
      off('2', 16, 58),
      off('3', 84, 58),
      off('4', 28, 26),
      off('5', 72, 26),
    ],
  },
  {
    id: '4-out-1-in',
    name: '4-Out 1-In',
    court: CourtType.Half,
    objects: [
      off('1', 50, 82),
      off('2', 14, 56),
      off('3', 86, 56),
      off('4', 30, 22),
      off('5', 50, 14),
    ],
  },
  {
    id: '1-4-low',
    name: '1-4 Low',
    court: CourtType.Half,
    objects: [
      off('1', 50, 78),
      off('2', 12, 40),
      off('3', 88, 40),
      off('4', 36, 12),
      off('5', 64, 12),
    ],
  },
  {
    id: 'horns',
    name: 'Horns',
    court: CourtType.Half,
    objects: [
      off('1', 50, 80),
      off('2', 10, 66),
      off('3', 90, 66),
      off('4', 34, 20),
      off('5', 66, 20),
    ],
  },
  {
    id: 'box',
    name: 'Box',
    court: CourtType.Half,
    objects: [
      off('1', 50, 84),
      off('2', 30, 46),
      off('3', 70, 46),
      off('4', 30, 16),
      off('5', 70, 16),
    ],
  },
];
