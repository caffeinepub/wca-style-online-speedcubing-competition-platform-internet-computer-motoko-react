import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { QUERY_KEYS } from '../api/queryKeys';
import type {
  UserProfile,
  Competition,
  ResultInput,
  AttemptInput,
  CompetitionInput,
  PaymentConfirmation,
  Event,
  PublicProfileInfo,
  PaidEvent,
  RazorpayOrderRequest,
  RazorpayOrderResponse,
} from '../backend';
import { Principal } from '@dfinity/principal';

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: QUERY_KEYS.isAdmin,
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
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

export function useGetCompetitions() {
  const { actor, isFetching } = useActor();

  return useQuery({
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

  return useQuery({
    queryKey: QUERY_KEYS.competition(id),
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCompetition(id);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateCompetition() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (competition: CompetitionInput) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createCompetition(competition);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.competitions });
    },
  });
}

export function useIsRazorpayConfigured() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: QUERY_KEYS.razorpayConfigured,
    queryFn: async () => {
      if (!actor) return false;
      return actor.isRazorpayConfigured();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000, // Cache for 30 seconds
  });
}

export function useCreateRazorpayOrder() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (request: RazorpayOrderRequest): Promise<RazorpayOrderResponse> => {
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
    onSuccess: (_, payment) => {
      // Invalidate payment history and competition data after successful payment
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.paymentHistory });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.competition(payment.competitionId) });
    },
  });
}

export function useStartCompetition() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({ competitionId, event }: { competitionId: bigint; event: Event }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.startCompetition(competitionId, event);
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
      attempt,
    }: {
      competitionId: bigint;
      event: Event;
      attemptIndex: bigint;
      attempt: AttemptInput;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitAttempt(competitionId, event, attemptIndex, attempt);
    },
    onSuccess: (_, { competitionId, event }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userResult(competitionId, event) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.results(competitionId, event) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.leaderboard(competitionId, event) });
    },
  });
}

export function useGetResults(competitionId: bigint, event: Event) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: QUERY_KEYS.results(competitionId, event),
    queryFn: async () => {
      if (!actor) return [];
      return actor.getResults(competitionId, event);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetLeaderboard(competitionId: bigint, event: Event) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: QUERY_KEYS.leaderboard(competitionId, event),
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLeaderboard(competitionId, event);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUserResult(competitionId: bigint, event: Event) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: QUERY_KEYS.userResult(competitionId, event),
    queryFn: async () => {
      if (!actor) return null;
      return actor.getUserResult(competitionId, event);
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useGetMultiplePublicProfiles(principals: Principal[]) {
  const { actor, isFetching } = useActor();

  const principalStrings = principals.map((p) => p.toString());

  return useQuery({
    queryKey: QUERY_KEYS.publicProfiles(principalStrings),
    queryFn: async () => {
      if (!actor || principals.length === 0) return new Map<string, PublicProfileInfo>();
      const profiles = await actor.getMultiplePublicProfiles(principals);
      return new Map(profiles.map(([principal, profile]) => [principal.toString(), profile]));
    },
    enabled: !!actor && !isFetching && principals.length > 0,
  });
}

export function useGetUserPaymentHistory() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<PaidEvent[]>({
    queryKey: QUERY_KEYS.paymentHistory,
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserPaymentHistory();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}
