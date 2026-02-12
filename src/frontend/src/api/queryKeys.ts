import { Event } from '../backend';

export const QUERY_KEYS = {
  currentUserProfile: ['currentUserProfile'],
  isAdmin: ['isAdmin'],
  competitions: ['competitions'],
  competition: (id: bigint) => ['competition', id.toString()],
  results: (competitionId: bigint, event: Event) => ['results', competitionId.toString(), event],
  leaderboard: (competitionId: bigint, event: Event) => ['leaderboard', competitionId.toString(), event],
  userResult: (competitionId: bigint, event: Event) => ['userResult', competitionId.toString(), event],
  allUserProfiles: ['allUserProfiles'],
  publicProfiles: (principalIds: string[]) => ['publicProfiles', ...principalIds.sort()],
};
