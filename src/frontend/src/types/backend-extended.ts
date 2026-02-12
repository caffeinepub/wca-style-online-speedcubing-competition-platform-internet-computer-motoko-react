// Extended types that are not exported from the generated backend interface
// These types match the backend Motoko definitions but aren't in the generated .d.ts

import type { Principal } from '@dfinity/principal';
import type { Event, UserProfile, Attempt, SolveStatus } from '../backend';

// CompetitionStatus enum - define locally since it's not exported
export type CompetitionStatus = 'upcoming' | 'running' | 'completed';

export interface Competition {
  id: bigint;
  name: string;
  slug: string;
  startDate: bigint;
  endDate: bigint;
  status: CompetitionStatus;
  participantLimit?: bigint;
  feeMode?: FeeMode;
  events: Event[];
  scrambles: [string[], Event][];
  isActive: boolean;
  isLocked: boolean;
}

export interface CompetitionPublic {
  id: bigint;
  name: string;
  slug: string;
  startDate: bigint;
  endDate: bigint;
  status: CompetitionStatus;
  participantLimit?: bigint;
  feeMode?: FeeMode;
  events: Event[];
}

export interface CompetitionInput {
  name: string;
  slug: string;
  startDate: bigint;
  endDate: bigint;
  status: CompetitionStatus;
  participantLimit?: bigint;
  feeMode?: FeeMode;
  events: Event[];
  scrambles: [string[], Event][];
}

export interface FeeMode {
  perEvent?: bigint;
  basePlusAdditional?: { baseFee: bigint; additionalFee: bigint };
  allEventsFlat?: bigint;
}

export interface Result {
  user: Principal;
  competitionId: bigint;
  event: Event;
  attempts: Attempt[];
  status: SolveStatus;
}

export interface LeaderboardEntry {
  user: Principal;
  userProfile?: PublicProfileInfo;
  attempts: Attempt[];
  bestTime: bigint;
}

export interface PublicProfileInfo {
  displayName: string;
  country?: string;
  gender?: string;
}

export interface UserSummary {
  principal: Principal;
  profile?: UserProfile;
  email?: string;
  isBlocked: boolean;
}

export interface SessionStateResponse {
  currentAttempt: bigint;
  inspectionStarted: boolean;
  startTime?: bigint;
  endTime?: bigint;
  attempts: Attempt[];
  isCompleted: boolean;
  event: Event;
}

// Re-export commonly used types
export type { Event, UserProfile, Attempt, SolveStatus };
