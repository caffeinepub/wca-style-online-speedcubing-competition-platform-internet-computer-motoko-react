import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { QUERY_KEYS } from '../api/queryKeys';
import type { UserProfile, Competition, ResultInput, AttemptInput } from '../backend';

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

export function useCreateUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createUserProfile(profile);
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
    mutationFn: async (competition: Competition) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createCompetition(competition);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.competitions });
    },
  });
}

export function useStartCompetition() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (competitionId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.startCompetition(competitionId);
    },
    onSuccess: (_, competitionId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.results(competitionId) });
    },
  });
}

export function useGetResults(competitionId: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: QUERY_KEYS.results(competitionId),
    queryFn: async () => {
      if (!actor) return [];
      return actor.getResults(competitionId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMyCompetitionResult(competitionId: bigint) {
  const { identity } = useInternetIdentity();
  const { data: results, isLoading } = useGetResults(competitionId);

  const myResult = results?.find(
    (r) => identity && r.user.toString() === identity.getPrincipal().toString()
  );

  return {
    data: myResult || null,
    isLoading,
  };
}

export function useSubmitAttempt() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      competitionId,
      attemptIndex,
      attempt,
    }: {
      competitionId: bigint;
      attemptIndex: bigint;
      attempt: AttemptInput;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitAttempt(competitionId, attemptIndex, attempt);
    },
    onSuccess: (_, { competitionId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.results(competitionId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.leaderboard(competitionId) });
    },
  });
}

export function useGetLeaderboard(competitionId: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: QUERY_KEYS.leaderboard(competitionId),
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLeaderboard(competitionId);
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
      
      const allResults = await Promise.all(
        competitions.map((comp) => actor.getResults(comp.id))
      );
      
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
