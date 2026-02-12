import { Event } from '../backend';

export const QUERY_KEYS = {
  isAdmin: ['isAdmin'],
  currentUserProfile: ['currentUserProfile'],
  competitions: ['competitions'],
  competition: (id: bigint) => ['competition', id.toString()],
  results: (competitionId: bigint, event: Event) => ['results', competitionId.toString(), event],
  leaderboard: (competitionId: bigint, event: Event) => ['leaderboard', competitionId.toString(), event],
  userResult: (competitionId: bigint, event: Event) => ['userResult', competitionId.toString(), event],
  publicProfiles: (principalIds: string[]) => ['publicProfiles', ...principalIds.sort()],
  paymentHistory: ['paymentHistory'],
  razorpayConfigured: ['razorpayConfigured'],
} as const;
