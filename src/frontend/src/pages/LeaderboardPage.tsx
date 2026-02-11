import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetLeaderboard, useGetCompetition } from '../hooks/useQueries';
import { useGetAllUserProfiles } from '../hooks/useQueries';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable';
import { calculateAo5, type LeaderboardEntry } from '../lib/ao5';
import { Trophy, Loader2, ArrowLeft } from 'lucide-react';

export default function LeaderboardPage() {
  const { competitionId } = useParams({ from: '/competition/$competitionId/leaderboard' });
  const navigate = useNavigate();
  const { data: competition, isLoading: compLoading } = useGetCompetition(BigInt(competitionId));
  const { data: results, isLoading: resultsLoading } = useGetLeaderboard(BigInt(competitionId));
  const { data: profiles } = useGetAllUserProfiles();

  if (compLoading || resultsLoading) {
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
        </div>
      </div>
    );
  }

  const completedResults = results?.filter((r) => r.status === 'completed') || [];

  const leaderboardEntries: LeaderboardEntry[] = completedResults
    .map((result) => {
      const profile = profiles?.find((p) => p.user.toString() === result.user.toString());
      const attempts = result.attempts.map((a) => ({
        time: Number(a.time),
        penalty: Number(a.penalty),
      }));
      const ao5 = calculateAo5(attempts);

      return {
        displayName: profile?.profile.displayName || 'Unknown',
        ao5,
        attempts,
      };
    })
    .sort((a, b) => {
      if (a.ao5 === 'DNF' && b.ao5 === 'DNF') return 0;
      if (a.ao5 === 'DNF') return 1;
      if (b.ao5 === 'DNF') return -1;
      return a.ao5 - b.ao5;
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate({ to: '/competition/$competitionId', params: { competitionId } })}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Competition
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-chart-1 to-chart-2 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">{competition.name}</h1>
          <p className="text-lg text-muted-foreground">Leaderboard</p>
        </div>

        {leaderboardEntries.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <p className="text-muted-foreground text-lg">
              No completed results yet. Be the first to finish!
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <LeaderboardTable entries={leaderboardEntries} />
          </div>
        )}
      </div>
    </div>
  );
}
