import { Event } from '../backend';
import { Principal } from '@dfinity/principal';

// Local type definitions for admin features

export interface ResultInput {
  user: Principal;
  competitionId: bigint;
  event: Event;
  attempts: Array<{
    time: bigint;
    penalty: bigint;
  }>;
  status: 'not_started' | 'in_progress' | 'completed';
  isHidden?: boolean;
}

export interface PublicProfileInfo {
  displayName: string;
  country?: string;
  gender?: string;
}

export interface UserSummary {
  principal: Principal;
  profile?: {
    displayName: string;
    mcubesId: string;
    country?: string;
    gender?: string;
  };
  email?: string;
  isBlocked: boolean;
}
