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
  AdminResultEntry,
  ResultInput,
  RazorpayOrderRequest as BackendRazorpayOrderRequest,
  RazorpayOrderResponse as BackendRazorpayOrderResponse,
  PaymentConfirmation as BackendPaymentConfirmation,
  Competition as BackendCompetition,
  CompetitionInput as BackendCompetitionInput,
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
      if (!actor) throw new Error('Actor not available');
      // Call the correct backend method: startOrResumeCompetitionSession
      const sessionToken = await actor.startOrResumeCompetitionSession(competitionId, event);
      return sessionToken;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.userResult(variables.competitionId, variables.event),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.competition(variables.competitionId),
      });
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
      attempts: Array<{ time: number; penalty: number }>;
      status: 'completed' | 'in_progress' | 'not_started';
    }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated');
      
      // Convert attempts to backend format
      const backendAttempts = attempts.map(a => ({
        time: BigInt(a.time),
        penalty: BigInt(a.penalty),
      }));
      
      // Map status to backend enum
      const backendStatus: SolveStatus = status === 'completed' ? SolveStatus.completed :
                                         status === 'in_progress' ? SolveStatus.in_progress :
                                         SolveStatus.not_started;
      
      const result: ResultInput = {
        user: identity.getPrincipal(),
        competitionId,
        event,
        attempts: backendAttempts,
        status: backendStatus,
        ao5: undefined, // Backend calculates this
      };
      
      return actor.submitResult(result);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.userResult(variables.competitionId, variables.event),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.leaderboard(variables.competitionId, variables.event),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.competition(variables.competitionId),
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
// User Profile Queries
// ============================================================================

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  // Return custom state that properly reflects actor dependency
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
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Stub hooks for profile setup (backend doesn't have these methods)
export function useCreateUserProfile() {
  const saveMutation = useSaveCallerUserProfile();
  
  return useMutation({
    mutationFn: async (displayName: string) => {
      // Generate a simple mcubes ID (in production this would be backend-generated)
      const mcubesId = `MCU${Date.now().toString().slice(-6)}`;
      const profile: UserProfile = {
        displayName,
        mcubesId,
        country: undefined,
        gender: undefined,
      };
      return saveMutation.mutateAsync(profile);
    },
  });
}

export function useSetUserEmail() {
  // Backend doesn't have a separate setUserEmail method
  // Email is handled through the profile
  return useMutation({
    mutationFn: async (email: string) => {
      // This is a no-op since backend doesn't support this
      console.log('Email would be set:', email);
    },
  });
}

export function useGetUserPaymentHistory() {
  const { actor, isFetching } = useActor();

  return useQuery<any[]>({
    queryKey: QUERY_KEYS.paymentHistory,
    queryFn: async () => {
      if (!actor) return [];
      // Backend doesn't have getUserPaymentHistory, return empty
      return [];
    },
    enabled: !!actor && !isFetching,
  });
}

// ============================================================================
// Payment Queries
// ============================================================================

export function useHasRazorpayConfig() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['hasRazorpayConfig'],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.hasRazorpayConfig();
      } catch (error) {
        console.error('Error checking Razorpay config:', error);
        return false;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

export function useCreateRazorpayOrder() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (request: RazorpayOrderRequest) => {
      if (!actor) throw new Error('Actor not available');
      const backendRequest: BackendRazorpayOrderRequest = {
        competitionId: request.competitionId,
        event: request.event,
      };
      const response = await actor.createRazorpayOrder(backendRequest);
      return {
        orderId: response.orderId,
        amount: response.amount,
        currency: response.currency,
        competitionName: response.competitionName,
        event: response.event,
      } as RazorpayOrderResponse;
    },
  });
}

export function useConfirmPayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (confirmation: PaymentConfirmation) => {
      if (!actor) throw new Error('Actor not available');
      const backendConfirmation: BackendPaymentConfirmation = {
        competitionId: confirmation.competitionId,
        event: confirmation.event,
        razorpayOrderId: confirmation.razorpayOrderId,
        razorpayPaymentId: confirmation.razorpayPaymentId,
        razorpaySignature: confirmation.razorpaySignature,
      };
      return actor.confirmPayment(backendConfirmation);
    },
    onSuccess: (_, variables) => {
      // Invalidate competition query to refresh payment status
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.competition(variables.competitionId),
      });
      // Invalidate user profile to refresh payment history
      queryClient.invalidateQueries({
        queryKey: ['currentUserProfile'],
      });
    },
  });
}

// ============================================================================
// Admin Queries
// ============================================================================

export function useAdminListUsers() {
  const { actor, isFetching } = useActor();

  return useQuery<UserSummary[]>({
    queryKey: QUERY_KEYS.adminUsers,
    queryFn: async () => {
      if (!actor) return [];
      try {
        return await actor.adminListUsers();
      } catch (error) {
        console.error('Error fetching admin users:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias for consistency
export const useAdminGetAllUsers = useAdminListUsers;

export function useAdminBlockUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, blocked }: { user: Principal; blocked: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminBlockUser(user, blocked);
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
      if (!actor) throw new Error('Actor not available');
      return actor.adminDeleteUser(user);
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
    mutationFn: async ({
      user,
      competitionId,
      event,
    }: {
      user: Principal;
      competitionId: bigint;
      event: Event;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminResetUserCompetitionStatus(user, competitionId, event);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminUsers });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.competitions });
    },
  });
}

export function useAdminGetUserSolveHistory() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminGetUserSolveHistory(user);
    },
  });
}

// ============================================================================
// Admin Competition Management
// ============================================================================

export function useAdminGetAllCompetitions() {
  const { actor, isFetching } = useActor();

  return useQuery<Competition[]>({
    queryKey: QUERY_KEYS.adminCompetitions,
    queryFn: async () => {
      if (!actor) return [];
      try {
        const publicComps = await actor.getAllCompetitions();
        const fullComps = await Promise.all(
          publicComps.map(async (comp) => {
            try {
              const fullComp = await actor.getCompetition(comp.id);
              return mapBackendCompetition(fullComp);
            } catch (error) {
              console.error(`Error fetching competition ${comp.id}:`, error);
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

export function useAdminCreateCompetition() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (competition: CompetitionInput) => {
      if (!actor) throw new Error('Actor not available');
      
      // Convert frontend CompetitionInput to backend Competition format
      const backendComp: BackendCompetition = {
        id: BigInt(0), // Will be assigned by backend
        name: competition.name,
        slug: competition.slug,
        startDate: competition.startDate,
        endDate: competition.endDate,
        status: toBackendStatus(competition.status),
        participantLimit: competition.participantLimit,
        feeMode: competition.feeMode ? {
          __kind__: competition.feeMode.perEvent !== undefined ? 'perEvent' :
                    competition.feeMode.basePlusAdditional !== undefined ? 'basePlusAdditional' :
                    'allEventsFlat',
          perEvent: competition.feeMode.perEvent,
          basePlusAdditional: competition.feeMode.basePlusAdditional,
          allEventsFlat: competition.feeMode.allEventsFlat,
        } as any : undefined,
        events: competition.events,
        scrambles: competition.scrambles,
        isActive: true,
        isLocked: false,
        registrationStartDate: competition.registrationStartDate,
      };
      
      return actor.createCompetition(backendComp);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminCompetitions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.competitions });
    },
  });
}

export function useAdminUpdateCompetition() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, competition }: { id: bigint; competition: CompetitionInput }) => {
      if (!actor) throw new Error('Actor not available');
      
      const backendInput: BackendCompetitionInput = {
        name: competition.name,
        slug: competition.slug,
        startDate: competition.startDate,
        endDate: competition.endDate,
        status: toBackendStatus(competition.status),
        participantLimit: competition.participantLimit,
        feeMode: competition.feeMode ? {
          __kind__: competition.feeMode.perEvent !== undefined ? 'perEvent' :
                    competition.feeMode.basePlusAdditional !== undefined ? 'basePlusAdditional' :
                    'allEventsFlat',
          perEvent: competition.feeMode.perEvent,
          basePlusAdditional: competition.feeMode.basePlusAdditional,
          allEventsFlat: competition.feeMode.allEventsFlat,
        } as any : undefined,
        events: competition.events,
        scrambles: competition.scrambles,
        registrationStartDate: competition.registrationStartDate,
      };
      
      return actor.updateCompetition(id, backendInput);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminCompetitions });
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminCompetitions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.competitions });
    },
  });
}

export function useAdminLockCompetition() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, locked }: { id: bigint; locked: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.lockCompetition(id, locked);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminCompetitions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.competitions });
    },
  });
}

export function useAdminActivateCompetition() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, active }: { id: bigint; active: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.activateCompetition(id, active);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminCompetitions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.competitions });
    },
  });
}

// ============================================================================
// Admin Results Management
// ============================================================================

export function useAdminGetCompetitionResults(competitionId: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: QUERY_KEYS.adminCompetitionResults(competitionId),
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const results = await actor.adminListCompetitionResults(competitionId);
      return results.map((r: AdminResultEntry) => ({
        ...r,
        isHidden: r.isHidden,
      }));
    },
    enabled: !!actor && !isFetching && competitionId > BigInt(0),
  });
}

export function useAdminToggleResultVisibility() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      user,
      competitionId,
      event,
      hidden,
    }: {
      user: Principal;
      competitionId: bigint;
      event: Event;
      hidden: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adminToggleResultVisibility(user, competitionId, event, hidden);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'competitionResults'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.competitions });
    },
  });
}
