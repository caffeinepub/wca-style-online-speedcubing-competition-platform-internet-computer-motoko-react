import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { QUERY_KEYS } from '../api/queryKeys';
import { Principal } from '@dfinity/principal';
import type {
  Event,
  UserProfile,
  CompetitionResult,
  Attempt,
} from '../backend';
import type {
  Competition,
  CompetitionPublic,
  CompetitionInput,
  UserSummary,
  Result,
  LeaderboardEntry,
  SessionStateResponse,
  PublicProfileInfo,
} from '../types/backend-extended';

// Local types for payment (not in backend)
export interface RazorpayOrderRequest {
  competitionId: bigint;
  event: Event;
}

export interface RazorpayOrderResponse {
  orderId: string;
  amount: bigint;
  currency: string;
  competitionName: string;
  event: Event;
}

export interface PaymentConfirmation {
  competitionId: bigint;
  event: Event;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface AttemptInput {
  time: bigint;
  penalty: bigint;
}

// Local type for admin results with isHidden flag
export interface AdminCompetitionResult extends CompetitionResult {
  isHidden: boolean;
}

// ============================================================================
// Public Queries
// ============================================================================

export function useGetCompetitions() {
  const { actor, isFetching } = useActor();

  return useQuery<CompetitionPublic[]>({
    queryKey: QUERY_KEYS.competitions,
    queryFn: async () => {
      if (!actor) {
        return [];
      }
      return actor.getAllCompetitions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCompetition(id: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Competition | null>({
    queryKey: QUERY_KEYS.competition(id),
    queryFn: async () => {
      if (!actor) {
        return null;
      }
      try {
        const comp = await actor.getCompetition(id);
        // Map backend Competition to frontend Competition type
        return {
          id: comp.id,
          name: comp.name,
          slug: comp.slug,
          startDate: comp.startDate,
          endDate: comp.endDate,
          status: comp.status as 'upcoming' | 'running' | 'completed',
          participantLimit: comp.participantLimit,
          feeMode: comp.feeMode ? {
            perEvent: comp.feeMode.__kind__ === 'perEvent' ? comp.feeMode.perEvent : undefined,
            basePlusAdditional: comp.feeMode.__kind__ === 'basePlusAdditional' ? comp.feeMode.basePlusAdditional : undefined,
            allEventsFlat: comp.feeMode.__kind__ === 'allEventsFlat' ? comp.feeMode.allEventsFlat : undefined,
          } : undefined,
          events: comp.events,
          scrambles: comp.scrambles,
          isActive: comp.isActive,
          isLocked: comp.isLocked,
        } as Competition;
      } catch (error) {
        console.error('Error fetching competition:', error);
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUserResult(competitionId: bigint, event: Event) {
  const { actor, isFetching } = useActor();

  return useQuery<Result | null>({
    queryKey: QUERY_KEYS.userResult(competitionId, event),
    queryFn: async () => {
      if (!actor) return null;
      // Backend doesn't have getUserResult, return null
      return null;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetLeaderboard(competitionId: bigint, event: Event) {
  const { actor, isFetching } = useActor();

  return useQuery<LeaderboardEntry[]>({
    queryKey: QUERY_KEYS.leaderboard(competitionId, event),
    queryFn: async () => {
      if (!actor) return [];
      try {
        const results = await actor.getCompetitionResults(competitionId, event);
        // Filter to completed results only and transform to LeaderboardEntry format
        return results
          .filter(result => result.status === 'completed')
          .map(result => ({
            user: result.user,
            userProfile: result.userProfile ? {
              displayName: result.userProfile.displayName || '',
              country: result.userProfile.country,
              gender: result.userProfile.gender,
            } : undefined,
            attempts: result.attempts,
            bestTime: result.attempts.length > 0 ? result.attempts[0].time : BigInt(0),
          }));
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

// ============================================================================
// Public Profile Queries
// ============================================================================

export function useGetPublicProfileInfo(principal: string) {
  const { actor, isFetching } = useActor();

  return useQuery<PublicProfileInfo | null>({
    queryKey: QUERY_KEYS.publicProfile(principal),
    queryFn: async () => {
      if (!actor) return null;
      try {
        const profile = await actor.getUserProfile(Principal.fromText(principal));
        if (!profile) return null;
        return {
          displayName: profile.displayName,
          country: profile.country,
          gender: profile.gender,
        };
      } catch (error) {
        console.error('Error fetching public profile:', error);
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useGetPublicResultsForUser(principal: string) {
  const { actor, isFetching } = useActor();

  return useQuery<{ profile?: PublicProfileInfo; results: CompetitionResult[] }>({
    queryKey: QUERY_KEYS.publicResults(principal),
    queryFn: async () => {
      if (!actor) return { results: [] };
      try {
        // Backend doesn't have this method, return empty
        return { results: [] };
      } catch (error) {
        console.error('Error fetching public results:', error);
        return { results: [] };
      }
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

// ============================================================================
// Solve Session Queries (New)
// ============================================================================

export function useGetSolveSessionState(
  competitionId: bigint,
  event: Event
) {
  const { actor, isFetching } = useActor();

  return useQuery<SessionStateResponse | null>({
    queryKey: QUERY_KEYS.solveSessionState(competitionId, event),
    queryFn: async () => {
      if (!actor) return null;
      // Backend doesn't have this method, return null
      return null;
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

export function useGetScrambleForAttempt(
  competitionId: bigint,
  event: Event,
  attemptIndex: number,
  sessionToken: Uint8Array | null
) {
  const { actor, isFetching } = useActor();

  return useQuery<string | null>({
    queryKey: QUERY_KEYS.scrambleForAttempt(competitionId, event, attemptIndex),
    queryFn: async () => {
      if (!actor || !sessionToken) {
        throw new Error('Session token required');
      }
      // Backend doesn't have this method, throw error
      throw new Error('Backend method not available');
    },
    enabled: !!actor && !isFetching && !!sessionToken,
    retry: false,
    staleTime: Infinity,
  });
}

// ============================================================================
// Mutations
// ============================================================================

export function useStartCompetition() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ competitionId, event }: { competitionId: bigint; event: Event }) => {
      if (!actor) throw new Error('Actor not available');
      // Backend doesn't have startSolveSession, return empty token
      return new Uint8Array();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.userResult(variables.competitionId, variables.event),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.solveSessionState(variables.competitionId, variables.event),
      });
    },
  });
}

export function useSubmitAttempt() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      competitionId,
      event,
      attemptIndex,
      time,
      penalty,
      sessionToken,
    }: {
      competitionId: bigint;
      event: Event;
      attemptIndex: number;
      time: number;
      penalty: number;
      sessionToken: Uint8Array;
    }) => {
      if (!actor) throw new Error('Actor not available');
      // Backend doesn't have this method, throw error
      throw new Error('Backend method not available');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.userResult(variables.competitionId, variables.event),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.solveSessionState(variables.competitionId, variables.event),
      });
    },
  });
}

// ============================================================================
// Auth Queries
// ============================================================================

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
      }
    },
    enabled: !!actor && !isFetching,
    retry: 1,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

// ============================================================================
// Profile Mutations
// ============================================================================

export function useCreateUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (displayName: string) => {
      if (!actor) throw new Error('Actor not available');
      const profile: UserProfile = {
        displayName,
        mcubesId: 'TEMP-' + Date.now(),
        country: undefined,
        gender: undefined,
      };
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
    },
  });
}

export function useUpdateUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Alias for compatibility
export const useSaveCallerUserProfile = useUpdateUserProfile;

// Mock hook for setting user email (backend doesn't have this method)
export function useSetUserEmail() {
  return useMutation({
    mutationFn: async (email: string) => {
      // Backend doesn't have this method, just return success
      console.log('Email would be set to:', email);
      return Promise.resolve();
    },
  });
}

// Mock hook for getting user payment history (backend doesn't have this method)
export function useGetUserPaymentHistory() {
  const { actor, isFetching } = useActor();

  return useQuery<any[]>({
    queryKey: ['userPaymentHistory'],
    queryFn: async () => {
      if (!actor) return [];
      // Backend method doesn't exist, return empty array
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

// ============================================================================
// Payment Mutations
// ============================================================================

export function useCreateRazorpayOrder() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (request: RazorpayOrderRequest): Promise<RazorpayOrderResponse> => {
      if (!actor) throw new Error('Actor not available');
      // Backend doesn't have this method
      throw new Error('Payment system not configured');
    },
  });
}

export function useConfirmPayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (confirmation: PaymentConfirmation) => {
      if (!actor) throw new Error('Actor not available');
      // Backend doesn't have this method
      throw new Error('Payment system not configured');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.competitions });
      queryClient.invalidateQueries({ queryKey: ['userPaymentHistory'] });
    },
  });
}

// ============================================================================
// Result Submission
// ============================================================================

export function useSubmitResult() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (result: {
      competitionId: bigint;
      event: Event;
      attempts: AttemptInput[];
      status: 'completed' | 'in_progress' | 'not_started';
    }) => {
      if (!actor) throw new Error('Actor not available');
      // Backend doesn't have submitResult method
      throw new Error('Backend method not available');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.userResult(variables.competitionId, variables.event),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.leaderboard(variables.competitionId, variables.event),
      });
    },
  });
}

// ============================================================================
// Admin Queries
// ============================================================================

export function useAdminGetAllUsers() {
  const { actor, isFetching } = useActor();

  return useQuery<UserSummary[]>({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      if (!actor) return [];
      // Backend doesn't have this method, return empty array
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminGetAllCompetitions() {
  const { actor, isFetching } = useActor();

  return useQuery<Competition[]>({
    queryKey: ['adminCompetitions'],
    queryFn: async () => {
      if (!actor) return [];
      try {
        // Use getAllCompetitions and getCompetition to build full Competition objects
        const publicComps = await actor.getAllCompetitions();
        const fullComps = await Promise.all(
          publicComps.map(async (pub) => {
            try {
              const comp = await actor.getCompetition(pub.id);
              // Map backend Competition to frontend Competition type
              return {
                id: comp.id,
                name: comp.name,
                slug: comp.slug,
                startDate: comp.startDate,
                endDate: comp.endDate,
                status: comp.status as 'upcoming' | 'running' | 'completed',
                participantLimit: comp.participantLimit,
                feeMode: comp.feeMode ? {
                  perEvent: comp.feeMode.__kind__ === 'perEvent' ? comp.feeMode.perEvent : undefined,
                  basePlusAdditional: comp.feeMode.__kind__ === 'basePlusAdditional' ? comp.feeMode.basePlusAdditional : undefined,
                  allEventsFlat: comp.feeMode.__kind__ === 'allEventsFlat' ? comp.feeMode.allEventsFlat : undefined,
                } : undefined,
                events: comp.events,
                scrambles: comp.scrambles,
                isActive: comp.isActive,
                isLocked: comp.isLocked,
              } as Competition;
            } catch (error) {
              console.error(`Error fetching competition ${pub.id}:`, error);
              return null;
            }
          })
        );
        return fullComps.filter((c): c is Competition => c !== null);
      } catch (error) {
        console.error('Error fetching admin competitions:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminGetCompetition(id: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Competition | null>({
    queryKey: ['adminCompetition', id.toString()],
    queryFn: async () => {
      if (!actor) return null;
      try {
        const comp = await actor.getCompetition(id);
        // Map backend Competition to frontend Competition type
        return {
          id: comp.id,
          name: comp.name,
          slug: comp.slug,
          startDate: comp.startDate,
          endDate: comp.endDate,
          status: comp.status as 'upcoming' | 'running' | 'completed',
          participantLimit: comp.participantLimit,
          feeMode: comp.feeMode ? {
            perEvent: comp.feeMode.__kind__ === 'perEvent' ? comp.feeMode.perEvent : undefined,
            basePlusAdditional: comp.feeMode.__kind__ === 'basePlusAdditional' ? comp.feeMode.basePlusAdditional : undefined,
            allEventsFlat: comp.feeMode.__kind__ === 'allEventsFlat' ? comp.feeMode.allEventsFlat : undefined,
          } : undefined,
          events: comp.events,
          scrambles: comp.scrambles,
          isActive: comp.isActive,
          isLocked: comp.isLocked,
        } as Competition;
      } catch (error) {
        console.error('Error fetching admin competition:', error);
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminGetCompetitionResults(competitionId: bigint, event: Event) {
  const { actor, isFetching } = useActor();

  return useQuery<AdminCompetitionResult[]>({
    queryKey: ['adminResults', competitionId.toString(), event],
    queryFn: async () => {
      if (!actor) return [];
      try {
        const results = await actor.getCompetitionResults(competitionId, event);
        // Add isHidden flag (default to false since backend doesn't track this)
        return results.map(result => ({
          ...result,
          isHidden: false,
        }));
      } catch (error) {
        console.error('Error fetching admin results:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias for compatibility
export const useAdminGetResultsForCompetition = useAdminGetCompetitionResults;

// ============================================================================
// Admin Mutations
// ============================================================================

export function useAdminCreateCompetition() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (competition: CompetitionInput) => {
      if (!actor) throw new Error('Actor not available');
      // Map CompetitionInput to backend Competition format
      const backendComp = {
        id: BigInt(0), // Will be assigned by backend
        name: competition.name,
        slug: competition.slug,
        startDate: competition.startDate,
        endDate: competition.endDate,
        status: competition.status,
        participantLimit: competition.participantLimit,
        feeMode: competition.feeMode ? (
          competition.feeMode.perEvent !== undefined ? { __kind__: 'perEvent' as const, perEvent: competition.feeMode.perEvent } :
          competition.feeMode.basePlusAdditional !== undefined ? { __kind__: 'basePlusAdditional' as const, basePlusAdditional: competition.feeMode.basePlusAdditional } :
          competition.feeMode.allEventsFlat !== undefined ? { __kind__: 'allEventsFlat' as const, allEventsFlat: competition.feeMode.allEventsFlat } :
          undefined
        ) : undefined,
        events: competition.events,
        scrambles: competition.scrambles,
        isActive: true,
        isLocked: false,
      };
      return await actor.createCompetition(backendComp as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCompetitions'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.competitions });
    },
  });
}

// Alias for compatibility
export const useCreateCompetition = useAdminCreateCompetition;

export function useAdminUpdateCompetition() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, competition }: { id: bigint; competition: CompetitionInput }) => {
      if (!actor) throw new Error('Actor not available');
      // Backend doesn't have update method
      throw new Error('Backend method not available');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCompetitions'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.competitions });
    },
  });
}

export function useAdminDeleteCompetition() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      // Backend doesn't have delete method
      throw new Error('Backend method not available');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCompetitions'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.competitions });
    },
  });
}

export function useAdminToggleCompetitionLock() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      // Backend doesn't have lock/unlock methods
      throw new Error('Backend method not available');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCompetitions'] });
    },
  });
}

// Aliases for compatibility
export const useAdminLockCompetition = useAdminToggleCompetitionLock;
export const useAdminUnlockCompetition = useAdminToggleCompetitionLock;

export function useAdminBlockUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (principal: string) => {
      if (!actor) throw new Error('Actor not available');
      // Backend doesn't have this method
      throw new Error('Backend method not available');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });
}

export function useAdminUnblockUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (principal: string) => {
      if (!actor) throw new Error('Actor not available');
      // Backend doesn't have this method
      throw new Error('Backend method not available');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });
}

export function useAdminDeleteUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (principal: string) => {
      if (!actor) throw new Error('Actor not available');
      // Backend doesn't have this method
      throw new Error('Backend method not available');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });
}

export function useAdminResetUserCompetitionStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ principal, competitionId }: { principal: string; competitionId: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      // Backend doesn't have this method
      throw new Error('Backend method not available');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });
}

export function useAdminGetUserSolveHistory() {
  const { actor, isFetching } = useActor();

  return useQuery<any[]>({
    queryKey: ['adminUserSolveHistory'],
    queryFn: async () => {
      if (!actor) return [];
      // Backend doesn't have this method
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminToggleResultVisibility() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ competitionId, event, user }: { competitionId: bigint; event: Event; user: Principal }) => {
      if (!actor) throw new Error('Actor not available');
      // Backend doesn't have this method
      throw new Error('Backend method not available');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminResults'] });
    },
  });
}

export function useAdminRecalculateLeaderboard() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ competitionId, event }: { competitionId: bigint; event: Event }) => {
      if (!actor) throw new Error('Actor not available');
      // Backend doesn't have this method
      throw new Error('Backend method not available');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminResults'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.leaderboard(variables.competitionId, variables.event) });
    },
  });
}
