import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { QUERY_KEYS } from '../api/queryKeys';
import { Principal } from '@dfinity/principal';
import type {
  Competition,
  CompetitionPublic,
  UserProfile,
  CompetitionInput,
  Event,
  RazorpayOrderRequest,
  RazorpayOrderResponse,
  PaymentConfirmation,
  UserSummary,
  CompetitionResult,
  Result,
  LeaderboardEntry,
  SessionStateResponse,
  AttemptInput,
  PublicProfileInfo,
} from '../backend';

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
      if (!actor) return [];
      return actor.getCompetitions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCompetition(id: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Competition | null>({
    queryKey: QUERY_KEYS.competition(id),
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCompetition(id);
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
      return actor.getCallerResult(competitionId, event);
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
      return actor.getLeaderboard(competitionId, event);
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
        return await actor.getPublicProfileInfo(Principal.fromText(principal));
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
        return await actor.getPublicResultsForUser(Principal.fromText(principal), false);
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
      return actor.getSessionState(competitionId, event);
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
      return actor.getScramble(competitionId, event, BigInt(attemptIndex), sessionToken);
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
      return actor.startCompetition(competitionId, event);
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
      return actor.submitAttempt(
        competitionId,
        event,
        BigInt(attemptIndex),
        BigInt(time),
        BigInt(penalty),
        sessionToken
      );
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
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsRazorpayConfigured() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isRazorpayConfigured'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isRazorpayConfigured();
    },
    enabled: !!actor && !isFetching,
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
      return actor.createUserProfile(displayName, null, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentUserProfile });
    },
  });
}

export function useSetUserEmail() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (email: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setUserEmail(email);
    },
  });
}

export function useSaveUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentUserProfile });
    },
  });
}

// Alias for backward compatibility
export const useSaveCallerUserProfile = useSaveUserProfile;

// ============================================================================
// Payment Mutations
// ============================================================================

export function useCreateRazorpayOrder() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (request: RazorpayOrderRequest) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createRazorpayOrder(request);
    },
  });
}

export function useConfirmPayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: PaymentConfirmation) => {
      if (!actor) throw new Error('Actor not available');
      return actor.confirmPayment(payment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.competitions });
    },
  });
}

// Placeholder for payment history - backend doesn't provide this yet
export function useGetUserPaymentHistory() {
  const { actor, isFetching } = useActor();

  return useQuery<any[]>({
    queryKey: ['userPaymentHistory'],
    queryFn: async () => {
      // Backend doesn't have this endpoint yet
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

// ============================================================================
// Admin Queries
// ============================================================================

export function useAdminGetAllCompetitions() {
  const { actor, isFetching } = useActor();

  return useQuery<Competition[]>({
    queryKey: ['adminCompetitions'],
    queryFn: async () => {
      if (!actor) return [];
      const publicComps = await actor.getCompetitions();
      const fullComps = await Promise.all(
        publicComps.map(async (comp) => {
          const full = await actor.getCompetition(comp.id);
          return full;
        })
      );
      return fullComps.filter((c): c is Competition => c !== null);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminGetResultsForCompetition(competitionId: bigint, event: Event) {
  const { actor, isFetching } = useActor();

  return useQuery<AdminCompetitionResult[]>({
    queryKey: ['adminResults', competitionId.toString(), event],
    queryFn: async () => {
      if (!actor || !event || competitionId === BigInt(0)) return [];
      
      const results = await actor.listCompetitionResults(competitionId, event);
      
      // Get the leaderboard to check which entries are hidden
      const leaderboard = await actor.getLeaderboard(competitionId, event);
      const visibleUserPrincipals = new Set(leaderboard.map(entry => entry.user.toString()));
      
      // Map results to include isHidden flag based on leaderboard visibility
      return results.map(result => ({
        ...result,
        isHidden: !visibleUserPrincipals.has(result.user.toString()),
      }));
    },
    enabled: !!actor && !isFetching && !!event && competitionId !== BigInt(0),
  });
}

export function useAdminListAllUsers() {
  const { actor, isFetching } = useActor();

  return useQuery<UserSummary[]>({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAllUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias for backward compatibility
export const useAdminGetAllUsers = useAdminListAllUsers;

// Placeholder for user solve history - backend doesn't provide this yet
export function useAdminGetUserSolveHistory(principal: string) {
  const { actor, isFetching } = useActor();

  return useQuery<CompetitionResult[]>({
    queryKey: ['adminUserSolveHistory', principal],
    queryFn: async () => {
      if (!actor || !principal) return [];
      // Use the public results endpoint for now
      try {
        const data = await actor.getPublicResultsForUser(Principal.fromText(principal), true);
        return data.results;
      } catch (error) {
        console.error('Error fetching user solve history:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

// ============================================================================
// Admin Mutations
// ============================================================================

export function useAdminCreateCompetition() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (competition: CompetitionInput) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createCompetition(competition);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCompetitions'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.competitions });
    },
  });
}

// Alias for backward compatibility
export const useCreateCompetition = useAdminCreateCompetition;

export function useAdminUpdateCompetition() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, competition }: { id: bigint; competition: CompetitionInput }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateCompetition(id, competition);
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
      return actor.deleteCompetition(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCompetitions'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.competitions });
    },
  });
}

export function useAdminLockCompetition() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.lockCompetition(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCompetitions'] });
    },
  });
}

export function useAdminUnlockCompetition() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.unlockCompetition(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCompetitions'] });
    },
  });
}

export function useAdminBlockUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (user: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.blockUser(Principal.fromText(user));
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
    mutationFn: async (user: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.unblockUser(Principal.fromText(user));
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
    mutationFn: async (user: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteUser(Principal.fromText(user));
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
    mutationFn: async ({
      user,
      competitionId,
      event,
    }: {
      user: string;
      competitionId: bigint;
      event: Event;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.resetUserCompetitionStatus(Principal.fromText(user), competitionId, event);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminResults'] });
    },
  });
}

export function useAdminUpdateResultAttempts() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      user,
      competitionId,
      event,
      attempts,
    }: {
      user: string;
      competitionId: bigint;
      event: Event;
      attempts: AttemptInput[];
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateResultAttempts(Principal.fromText(user), competitionId, event, attempts);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminResults'] });
    },
  });
}

export function useAdminToggleLeaderboardVisibility() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      user,
      competitionId,
      event,
      shouldHide,
    }: {
      user: string;
      competitionId: bigint;
      event: Event;
      shouldHide: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.toggleLeaderboardEntryVisibility(
        Principal.fromText(user),
        competitionId,
        event,
        shouldHide
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['adminResults', variables.competitionId.toString(), variables.event] 
      });
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.leaderboard(variables.competitionId, variables.event) 
      });
    },
  });
}

export function useAdminRecalculateLeaderboard() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      competitionId,
      event,
    }: {
      competitionId: bigint;
      event: Event;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return Promise.resolve();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['adminResults', variables.competitionId.toString(), variables.event] 
      });
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.leaderboard(variables.competitionId, variables.event) 
      });
    },
  });
}
