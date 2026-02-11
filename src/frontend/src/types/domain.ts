export type EventType = '3x3' | '2x2' | '4x4' | 'pyraminx' | 'skewb';

export const EVENT_LABELS: Record<EventType, string> = {
  '3x3': '3x3x3 Cube',
  '2x2': '2x2x2 Cube',
  '4x4': '4x4x4 Cube',
  pyraminx: 'Pyraminx',
  skewb: 'Skewb',
};

export const DEFAULT_EVENT: EventType = '3x3';
