import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { QUERY_KEYS } from '../api/queryKeys';
import { Principal } from '@dfinity/principal';
import { CompetitionStatus as BackendCompetitionStatus, SolveStatus } from '../backend';
import { useInternetIdentity } from './useInternetIdentity';
import type {
  Event,
  UserProfile,
  CompetitionResult,
  Attempt,
  RazorpayOrderRequest as BackendRazorpayOrderRequest,
  RazorpayOrderResponse as BackendRazorpayOrderResponse,
  PaymentConfirmation as BackendPaymentConfirmation,
  Competition as BackendCompetition,
  LeaderboardEntry as BackendLeaderboardEntry,
} from '../backend';
import type {
  Competition,
  CompetitionPublic,
  CompetitionInput,
  UserSummary,
  Result,
  LeaderboardEntry,
  PublicProfileInfo,
  CompetitionStatus,
  SessionStateResponse,
} from '../types/backend-extended';

// Local types for payment (matching backend)
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

// Local type for admin result entry
export interface AdminResultEntry {
  user: Principal;
  competitionId: bigint;
  event: Event;
  attempts: Attempt[];
  status: SolveStatus;
  ao5?: bigint;
  isHidden: boolean;
}

// Local type for result input
export interface ResultInput {
  user: Principal;
  competitionId: bigint;
  event: Event;
  attempts: AttemptInput[];
  status: SolveStatus;
  ao5?: bigint;
}

// Helper to convert frontend CompetitionStatus to backend enum
function toBackendStatus(status: CompetitionStatus): BackendCompetitionStatus {
  return BackendCompetitionStatus[status];
}

// Helper to convert backend CompetitionStatus to frontend type
function fromBackendStatus(status: BackendCompetitionStatus): CompetitionStatus {
  return status.toString() as CompetitionStatus;
}

// ============================================================================
// Authentication & Profile
// ============================================================================

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<boolean>({
    queryKey: QUERY_KEYS.isCallerAdmin,
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching && !!identity,
    retry: false,
  });
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<UserProfile | null>({
    queryKey: QUERY_KEYS.currentUserProfile,
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
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

export function useCreateUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { displayName: string; email?: string }) => {
      if (!actor) throw new Error('Actor not available');
      
      const profile: UserProfile = {
        displayName: params.displayName,
        mcubesId: '',
        country: undefined,
        gender: undefined,
      };
      
      await actor.saveCallerUserProfile(profile);
      
      if (params.email) {
        // Note: setUserEmail is not in the backend interface, so we skip this
        // The email will need to be set separately if the backend supports it
      }
      
      return profile;
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
      // Note: This method doesn't exist in the backend interface
      // This is a placeholder for when it's implemented
      throw new Error('Backend method not available: setUserEmail');
    },
  });
}

export function useGetUserPaymentHistory() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<any[]>({
    queryKey: QUERY_KEYS.userPaymentHistory,
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      // Note: This method doesn't exist in the backend interface
      // Return empty array as placeholder
      return [];
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

// ============================================================================
// Competitions
// ============================================================================

export function useGetCompetitions() {
  const { actor, isFetching } = useActor();

  return useQuery<CompetitionPublic[]>({
    queryKey: QUERY_KEYS.competitions,
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAllCompetitions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCompetition(competitionId: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<BackendCompetition>({
    queryKey: QUERY_KEYS.competition(competitionId.toString()),
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCompetition(competitionId);
    },
    enabled: !!actor && !isFetching,
  });
}

// ============================================================================
// Payment
// ============================================================================

export function useHasRazorpayConfig() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: QUERY_KEYS.hasRazorpayConfig,
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.hasRazorpayConfig();
    },
    enabled: !!actor && !isFetching,
  });
}

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
    mutationFn: async (confirmation: PaymentConfirmation) => {
      if (!actor) throw new Error('Actor not available');
      return actor.confirmPayment(confirmation);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userPaymentHistory });
    },
  });
}

// ============================================================================
// Solve Session & Attempts
// ============================================================================

export function useStartCompetition() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (params: { competitionId: bigint; event: Event }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.startOrResumeCompetitionSession(params.competitionId, params.event);
    },
  });
}

export function useGetSessionState(
  competitionId: bigint,
  event: Event,
  sessionToken: Uint8Array | null
) {
  const { actor, isFetching } = useActor();

  return useQuery<SessionStateResponse>({
    queryKey: QUERY_KEYS.sessionState(competitionId.toString(), event),
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!sessionToken) throw new Error('Session token required');
      // Note: Backend method doesn't exist yet
      throw new Error('Backend method not available: getSessionState');
    },
    enabled: !!actor && !isFetching && !!sessionToken,
    retry: false,
  });
}

export function useGetScrambleForAttempt(
  competitionId: bigint,
  event: Event,
  attemptIndex: number
) {
  const { actor, isFetching } = useActor();

  return useQuery<string>({
    queryKey: QUERY_KEYS.scramble(competitionId.toString(), event, attemptIndex),
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      // Note: Backend needs session token for scramble fetch
      // For now, we'll use a placeholder approach
      const competition = await actor.getCompetition(competitionId);
      const eventScrambles = competition.scrambles.find(([_, e]) => e === event);
      if (!eventScrambles || !eventScrambles[0][attemptIndex]) {
        throw new Error('No scramble available for this attempt');
      }
      return eventScrambles[0][attemptIndex];
    },
    enabled: !!actor && !isFetching && attemptIndex >= 0 && attemptIndex < 5,
  });
}

export function useSubmitSingleAttempt() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      competitionId: bigint;
      event: Event;
      sessionToken: Uint8Array;
      attemptIndex: number;
      time: bigint;
      penalty: bigint;
    }) => {
      if (!actor) throw new Error('Actor not available');
      // Note: Backend method doesn't exist yet
      throw new Error('Backend method not available: submitAttempt');
    },
    onSuccess: (_, variables) => {
      // Invalidate session state and leaderboard
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.sessionState(variables.competitionId.toString(), variables.event) 
      });
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.leaderboard(variables.competitionId.toString(), variables.event) 
      });
    },
  });
}

export function useSubmitResult() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      competitionId: bigint;
      event: Event;
      attempts: { time: number; penalty: number }[];
      status: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      // This is the old bulk submission - kept for compatibility
      // In practice, we now submit attempts one by one
      throw new Error('Use submitAttempt instead of bulk submission');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.leaderboard(variables.competitionId.toString(), variables.event) 
      });
    },
  });
}

// Get user's result for a specific competition and event
export function useGetUserResult(competitionId: bigint, event: Event) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<CompetitionResult | null>({
    queryKey: QUERY_KEYS.userResult(competitionId.toString(), event),
    queryFn: async () => {
      if (!actor || !identity) return null;
      const results = await actor.getCompetitionResults(competitionId, event);
      const userPrincipal = identity.getPrincipal();
      const userResult = results.find(r => r.user.toString() === userPrincipal.toString());
      return userResult || null;
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

// ============================================================================
// Leaderboard
// ============================================================================

export function useGetLeaderboard(competitionId: bigint, event: Event) {
  const { actor, isFetching } = useActor();

  return useQuery<BackendLeaderboardEntry[]>({
    queryKey: QUERY_KEYS.leaderboard(competitionId.toString(), event),
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCompetitionLeaderboard(competitionId, event);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCompetitorResults(competitor: Principal) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: QUERY_KEYS.competitorResults(competitor),
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCompetitorResults(competitor);
    },
    enabled: !!actor && !isFetching,
  });
}

// Get public profile info for a competitor
export function useGetPublicProfileInfo(principalString: string) {
  const { actor, isFetching } = useActor();

  return useQuery<PublicProfileInfo | null>({
    queryKey: QUERY_KEYS.publicProfile(principalString),
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        const principal = Principal.fromText(principalString);
        const competitorResults = await actor.getCompetitorResults(principal);
        // Extract profile info from first result if available
        if (competitorResults.results.length > 0 && competitorResults.results[0].userProfile) {
          const profile = competitorResults.results[0].userProfile;
          return {
            displayName: profile.displayName,
            country: profile.country,
            gender: profile.gender,
          };
        }
        return null;
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

// Get public results for a user
export function useGetPublicResultsForUser(principalString: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: QUERY_KEYS.competitorResults(principalString),
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const principal = Principal.fromText(principalString);
      return actor.getCompetitorResults(principal);
    },
    enabled: !!actor && !isFetching,
  });
}

// ============================================================================
// Admin Functions
// ============================================================================

// Admin: Get all competitions with full details including scrambles
export function useAdminGetAllCompetitions() {
  const { actor, isFetching } = useActor();

  return useQuery<BackendCompetition[]>({
    queryKey: QUERY_KEYS.adminCompetitions,
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      // Backend doesn't have separate admin endpoint, but we can use getCompetition for each
      const publicComps = await actor.getAllCompetitions();
      // Fetch full details for each competition
      const fullComps = await Promise.all(
        publicComps.map(comp => actor.getCompetition(comp.id))
      );
      return fullComps;
    },
    enabled: !!actor && !isFetching,
  });
}

// Admin: Get single competition with full details
export function useAdminGetCompetition(competitionId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<BackendCompetition>({
    queryKey: QUERY_KEYS.competition(competitionId?.toString() || 'null'),
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!competitionId) throw new Error('Competition ID required');
      return actor.getCompetition(competitionId);
    },
    enabled: !!actor && !isFetching && competitionId !== null,
  });
}

export function useAdminCreateCompetition() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CompetitionInput) => {
      if (!actor) throw new Error('Actor not available');
      // Note: Backend doesn't have admin create competition method
      throw new Error('Backend method not available: adminCreateCompetition');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.competitions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminCompetitions });
    },
  });
}

export function useAdminUpdateCompetition() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: bigint; updates: Partial<CompetitionInput> }) => {
      if (!actor) throw new Error('Actor not available');
      // Note: Backend doesn't have admin update competition method
      throw new Error('Backend method not available: adminUpdateCompetition');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.competitions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminCompetitions });
    },
  });
}

export function useAdminDeleteCompetition() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      // Note: Backend doesn't have admin delete competition method
      throw new Error('Backend method not available: adminDeleteCompetition');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.competitions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminCompetitions });
    },
  });
}

export function useAdminLockCompetition() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: bigint; locked: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      // Note: Backend doesn't have admin lock competition method
      throw new Error('Backend method not available: adminLockCompetition');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminCompetitions });
    },
  });
}

export function useAdminActivateCompetition() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: bigint; active: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      // Note: Backend doesn't have admin activate competition method
      throw new Error('Backend method not available: adminActivateCompetition');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminCompetitions });
    },
  });
}

// Admin: Get all users
export function useAdminGetUsers() {
  const { actor, isFetching } = useActor();

  return useQuery<UserSummary[]>({
    queryKey: QUERY_KEYS.adminUsers,
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      // Note: Backend doesn't have admin get users method
      throw new Error('Backend method not available: adminGetUsers');
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

export function useAdminBlockUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { principal: Principal; blocked: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      // Note: Backend doesn't have admin block user method
      throw new Error('Backend method not available: adminBlockUser');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminUsers });
    },
  });
}

export function useAdminDeleteUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (principal: Principal) => {
      if (!actor) throw new Error('Actor not available');
      // Note: Backend doesn't have admin delete user method
      throw new Error('Backend method not available: adminDeleteUser');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminUsers });
    },
  });
}

export function useAdminResetUserCompetitionStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { principal: Principal; competitionId: bigint; event: Event }) => {
      if (!actor) throw new Error('Actor not available');
      // Note: Backend doesn't have admin reset user competition status method
      throw new Error('Backend method not available: adminResetUserCompetitionStatus');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminUsers });
    },
  });
}

// Admin: Get competition results (all, including hidden)
export function useAdminGetCompetitionResults(competitionId: bigint | null, event: Event | null) {
  const { actor, isFetching } = useActor();

  return useQuery<AdminResultEntry[]>({
    queryKey: QUERY_KEYS.adminResults(competitionId?.toString() || 'null', event || 'null'),
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!competitionId || !event) return [];
      // Note: Backend doesn't have admin get results method that includes hidden flag
      // We'll use the public method and assume all are visible
      const results = await actor.getCompetitionResults(competitionId, event);
      return results.map(r => ({
        user: r.user,
        competitionId,
        event: r.event,
        attempts: r.attempts,
        status: r.status,
        ao5: r.ao5,
        isHidden: false, // Backend doesn't expose this yet
      }));
    },
    enabled: !!actor && !isFetching && competitionId !== null && event !== null,
    retry: false,
  });
}

export function useAdminToggleResultVisibility() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { 
      competitionId: bigint; 
      event: Event; 
      user: Principal; 
      hidden: boolean 
    }) => {
      if (!actor) throw new Error('Actor not available');
      // Note: Backend doesn't have admin toggle result visibility method
      throw new Error('Backend method not available: adminToggleResultVisibility');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.adminResults(variables.competitionId.toString(), variables.event) 
      });
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.leaderboard(variables.competitionId.toString(), variables.event) 
      });
    },
  });
}
