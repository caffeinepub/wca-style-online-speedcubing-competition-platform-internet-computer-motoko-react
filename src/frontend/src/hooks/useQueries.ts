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
  CompetitionStatus,
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

// Helper to convert backend status to frontend
function fromBackendStatus(status: BackendCompetitionStatus): CompetitionStatus {
  return status as unknown as CompetitionStatus;
}

// Helper to convert backend Competition to frontend Competition
function mapBackendCompetition(comp: BackendCompetition): Competition {
  return {
    id: comp.id,
    name: comp.name,
    slug: comp.slug,
    startDate: comp.startDate,
    endDate: comp.endDate,
    status: fromBackendStatus(comp.status),
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
    registrationStartDate: comp.registrationStartDate,
  };
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
        return mapBackendCompetition(comp);
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
// Auth & Profile Queries
// ============================================================================

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: QUERY_KEYS.isCallerAdmin,
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) {
        throw new Error('Actor not available');
      }
      await actor.saveCallerUserProfile(profile);
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
    mutationFn: async (displayName: string) => {
      if (!actor) {
        throw new Error('Actor not available');
      }
      // Generate mcubes ID (simplified - in production this would be done by backend)
      const mcubesId = `MCU${Date.now()}`;
      const profile: UserProfile = {
        displayName,
        mcubesId,
        country: undefined,
        gender: undefined,
      };
      await actor.saveCallerUserProfile(profile);
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
      if (!actor) {
        throw new Error('Actor not available');
      }
      // Backend doesn't have setUserEmail method
      // This is a placeholder for future implementation
      console.log('Setting user email:', email);
    },
  });
}

export function useGetUserPaymentHistory() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: QUERY_KEYS.paymentHistory,
    queryFn: async () => {
      if (!actor) return [];
      // Backend doesn't have getUserPaymentHistory
      // Return empty array as placeholder
      return [];
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
        const competitorResults = await actor.getCompetitorResults(Principal.fromText(principal));
        return {
          results: competitorResults.results || [],
        };
      } catch (error) {
        console.error('Error fetching public results:', error);
        return { results: [] };
      }
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

// ============================================================================
// Solve Session Queries
// ============================================================================

export function useGetScrambleForAttempt(
  competitionId: bigint,
  event: Event,
  attemptIndex: number
) {
  const { actor, isFetching } = useActor();

  return useQuery<string | null>({
    queryKey: QUERY_KEYS.scrambleForAttempt(competitionId, event, attemptIndex),
    queryFn: async () => {
      if (!actor) {
        throw new Error('Actor not available');
      }
      
      try {
        // Get competition to access scrambles
        const comp = await actor.getCompetition(competitionId);
        
        // Find scrambles for this event
        const eventScrambles = comp.scrambles.find(([_, e]) => e === event);
        if (!eventScrambles) {
          throw new Error('No scrambles found for this event');
        }
        
        const [scrambles] = eventScrambles;
        if (attemptIndex >= scrambles.length) {
          throw new Error('Invalid attempt index');
        }
        
        return scrambles[attemptIndex];
      } catch (error) {
        console.error('Error fetching scramble:', error);
        throw error;
      }
    },
    enabled: !!actor && !isFetching && attemptIndex >= 0,
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
      if (!actor) {
        throw new Error('Actor not available');
      }
      const sessionToken = await actor.startOrResumeCompetitionSession(competitionId, event);
      return sessionToken;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userResult(variables.competitionId, variables.event) });
    },
  });
}

export function useSubmitResult() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      competitionId,
      event,
      attempts,
      status,
    }: {
      competitionId: bigint;
      event: Event;
      attempts: { time: number; penalty: number }[];
      status: 'completed' | 'in_progress' | 'not_started';
    }) => {
      if (!actor) {
        throw new Error('Actor not available');
      }
      if (!identity) {
        throw new Error('User not authenticated');
      }

      const user = identity.getPrincipal();

      // Convert status string to backend enum
      let backendStatus: SolveStatus;
      if (status === 'completed') {
        backendStatus = SolveStatus.completed;
      } else if (status === 'in_progress') {
        backendStatus = SolveStatus.in_progress;
      } else {
        backendStatus = SolveStatus.not_started;
      }

      const resultInput: ResultInput = {
        user,
        competitionId,
        event,
        attempts: attempts.map(a => ({
          time: BigInt(a.time),
          penalty: BigInt(a.penalty),
        })),
        status: backendStatus,
        ao5: undefined,
      };

      // Backend doesn't have submitResult, this is a placeholder
      // In production, you would call the actual backend method
      console.log('Submitting result:', resultInput);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userResult(variables.competitionId, variables.event) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.leaderboard(variables.competitionId, variables.event) });
    },
  });
}

// ============================================================================
// Payment Mutations
// ============================================================================

export function useCreateRazorpayOrder() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (request: RazorpayOrderRequest): Promise<RazorpayOrderResponse> => {
      if (!actor) {
        throw new Error('Actor not available');
      }

      const backendRequest: BackendRazorpayOrderRequest = {
        competitionId: request.competitionId,
        event: request.event,
      };

      const response = await actor.createRazorpayOrder(backendRequest);
      return response;
    },
  });
}

export function useConfirmPayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (confirmation: PaymentConfirmation) => {
      if (!actor) {
        throw new Error('Actor not available');
      }

      const backendConfirmation: BackendPaymentConfirmation = {
        competitionId: confirmation.competitionId,
        event: confirmation.event,
        razorpayOrderId: confirmation.razorpayOrderId,
        razorpayPaymentId: confirmation.razorpayPaymentId,
        razorpaySignature: confirmation.razorpaySignature,
      };

      await actor.confirmPayment(backendConfirmation);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.currentUserProfile });
    },
  });
}

export function useCheckRazorpayConfig() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: QUERY_KEYS.razorpayConfigured,
    queryFn: async () => {
      if (!actor) return false;
      return actor.hasRazorpayConfig();
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias for backward compatibility
export const useHasRazorpayConfig = useCheckRazorpayConfig;

// ============================================================================
// Admin Mutations
// ============================================================================

export function useAdminCreateCompetition() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CompetitionInput) => {
      if (!actor) {
        throw new Error('Actor not available');
      }

      // Backend doesn't have adminCreateCompetition
      console.log('Creating competition:', input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.competitions });
    },
  });
}

export function useAdminGetAllCompetitions() {
  const { actor, isFetching } = useActor();

  return useQuery<Competition[]>({
    queryKey: QUERY_KEYS.adminCompetitions,
    queryFn: async () => {
      if (!actor) return [];
      // Backend doesn't have adminGetAllCompetitions
      // Use getAllCompetitions as fallback
      const comps = await actor.getAllCompetitions();
      return comps.map(comp => ({
        ...comp,
        scrambles: [],
        isActive: true,
        isLocked: false,
      }));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminUpdateCompetition() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: bigint; updates: Partial<CompetitionInput> }) => {
      if (!actor) {
        throw new Error('Actor not available');
      }
      // Backend doesn't have adminUpdateCompetition
      console.log('Updating competition:', id, updates);
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
      if (!actor) {
        throw new Error('Actor not available');
      }
      // Backend doesn't have adminDeleteCompetition
      console.log('Deleting competition:', id);
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
    mutationFn: async ({ id, locked }: { id: bigint; locked: boolean }) => {
      if (!actor) {
        throw new Error('Actor not available');
      }
      // Backend doesn't have adminLockCompetition
      console.log('Locking competition:', id, locked);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.competitions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminCompetitions });
    },
  });
}

export function useAdminActivateCompetition() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, active }: { id: bigint; active: boolean }) => {
      if (!actor) {
        throw new Error('Actor not available');
      }
      // Backend doesn't have adminActivateCompetition
      console.log('Activating competition:', id, active);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.competitions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminCompetitions });
    },
  });
}

export function useAdminGetCompetitionResults(competitionId: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<AdminResultEntry[]>({
    queryKey: QUERY_KEYS.adminCompetitionResults(competitionId),
    queryFn: async () => {
      if (!actor) return [];
      // Backend doesn't have adminGetCompetitionResults
      // Return empty array as placeholder
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminToggleResultVisibility() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      competitionId,
      user,
      event,
      hidden,
    }: {
      competitionId: bigint;
      user: Principal;
      event: Event;
      hidden: boolean;
    }) => {
      if (!actor) {
        throw new Error('Actor not available');
      }
      // Backend doesn't have adminToggleResultVisibility
      console.log('Toggling result visibility:', competitionId, user, event, hidden);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminCompetitionResults(variables.competitionId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.leaderboard(variables.competitionId, variables.event) });
    },
  });
}

export function useAdminGetAllUsers() {
  const { actor, isFetching } = useActor();

  return useQuery<UserSummary[]>({
    queryKey: QUERY_KEYS.adminUsers,
    queryFn: async () => {
      if (!actor) return [];
      // Backend doesn't have adminGetAllUsers
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAdminBlockUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, blocked }: { user: Principal; blocked: boolean }) => {
      if (!actor) {
        throw new Error('Actor not available');
      }
      // Backend doesn't have adminBlockUser
      console.log('Blocking user:', user, blocked);
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
    mutationFn: async (user: Principal) => {
      if (!actor) {
        throw new Error('Actor not available');
      }
      // Backend doesn't have adminDeleteUser
      console.log('Deleting user:', user);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminUsers });
    },
  });
}

export function useAdminGetUserSolveHistory() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) {
        throw new Error('Actor not available');
      }
      // Backend doesn't have adminGetUserSolveHistory
      console.log('Getting user solve history:', user);
      return [];
    },
  });
}

export function useAdminResetUserCompetitionStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, competitionId, event }: { user: Principal; competitionId: bigint; event: Event }) => {
      if (!actor) {
        throw new Error('Actor not available');
      }
      // Backend doesn't have adminResetUserCompetitionStatus
      console.log('Resetting user competition status:', user, competitionId, event);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminUsers });
    },
  });
}
