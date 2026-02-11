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
} from '../backend';

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
      return actor.createUserProfile(displayName);
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

export function useConfirmPayment() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (payment: PaymentConfirmation) => {
      if (!actor) throw new Error('Actor not available');
      return actor.confirmPayment(payment);
    },
  });
}

export function useStartCompetition() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ competitionId, event }: { competitionId: bigint; event: Event }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.startCompetition(competitionId, event);
    },
    onSuccess: (_, { competitionId, event }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.results(competitionId, event) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userResult(competitionId, event) });
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.results(competitionId, event) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.leaderboard(competitionId, event) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userResult(competitionId, event) });
    },
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

export function useGetAllUserProfiles() {
  const { actor, isFetching } = useActor();
  const { data: competitions } = useGetCompetitions();

  return useQuery({
    queryKey: QUERY_KEYS.allUserProfiles,
    queryFn: async () => {
      if (!actor || !competitions) return [];

      const allResultsPromises = competitions.flatMap((comp) =>
        comp.events.map((event) => actor.getResults(comp.id, event))
      );

      const allResults = await Promise.all(allResultsPromises);

      const uniqueUsers = new Set<string>();
      allResults.flat().forEach((result) => {
        uniqueUsers.add(result.user.toString());
      });

      const profiles = await Promise.all(
        Array.from(uniqueUsers).map(async (userStr) => {
          const principal = { toString: () => userStr } as any;
          const profile = await actor.getUserProfile(principal);
          return { user: principal, profile };
        })
      );

      return profiles.filter((p) => p.profile !== null) as Array<{
        user: any;
        profile: UserProfile;
      }>;
    },
    enabled: !!actor && !isFetching && !!competitions,
  });
}
