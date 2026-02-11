import { Event } from '../backend';

export const EVENT_LABELS: Record<Event, string> = {
  [Event.twoByTwo]: '2x2x2 Cube',
  [Event.threeByThree]: '3x3x3 Cube',
  [Event.fourByFour]: '4x4x4 Cube',
  [Event.fiveByFive]: '5x5x5 Cube',
  [Event.skewb]: 'Skewb',
  [Event.megaminx]: 'Megaminx',
  [Event.clock]: 'Clock',
  [Event.threeByThreeOneHanded]: '3x3 One-Handed',
  [Event.pyraminx]: 'Pyraminx',
};

export const ALL_EVENTS: Event[] = [
  Event.twoByTwo,
  Event.threeByThree,
  Event.fourByFour,
  Event.fiveByFive,
  Event.skewb,
  Event.megaminx,
  Event.clock,
  Event.threeByThreeOneHanded,
  Event.pyraminx,
];

export const DEFAULT_EVENT: Event = Event.threeByThree;
