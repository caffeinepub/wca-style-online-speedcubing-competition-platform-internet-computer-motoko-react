import { useParams, useSearch } from '@tanstack/react-router';
import { useGetCompetition, useGetLeaderboard, useGetMultiplePublicProfiles } from '../hooks/useQueries';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable';
import { Loader2, Trophy } from 'lucide-react';
import { Event } from '../backend';
import { DEFAULT_EVENT, EVENT_LABELS } from '../types/domain';
import { useMemo } from 'react';

export default function LeaderboardPage() {
  const { competitionId } = useParams({ from: '/competition/$competitionId/leaderboard' });
  const search = useSearch({ from: '/competition/$competitionId/leaderboard' }) as { event?: Event };
  const selectedEvent = search.event || DEFAULT_EVENT;

  const { data: competition, isLoading: compLoading } = useGetCompetition(BigInt(competitionId));
  const { data: leaderboard, isLoading: leaderboardLoading } = useGetLeaderboard(
    BigInt(competitionId),
    selectedEvent
  );

  const completedResults = useMemo(() => {
    return leaderboard?.filter((r) => r.status === 'completed') || [];
  }, [leaderboard]);

  const principals = useMemo(() => {
    return completedResults.map((r) => r.user);
  }, [completedResults]);

  const { data: publicProfiles, isLoading: profilesLoading } = useGetMultiplePublicProfiles(principals);

  if (compLoading || leaderboardLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-chart-1 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading leaderboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Competition Not Found</h2>
          <p className="text-muted-foreground">The competition you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-chart-1" />
            <h1 className="text-4xl font-bold">Leaderboard</h1>
          </div>
          <p className="text-muted-foreground">
            {competition.name} - {EVENT_LABELS[selectedEvent]}
          </p>
        </div>

        {completedResults.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold mb-2">No Results Yet</h2>
            <p className="text-muted-foreground">
              Be the first to complete this competition and claim the top spot!
            </p>
          </div>
        ) : profilesLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-chart-1" />
          </div>
        ) : (
          <LeaderboardTable results={completedResults} publicProfiles={publicProfiles || new Map()} />
        )}
      </div>
    </div>
  );
}
