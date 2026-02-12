import { useParams, useSearch, useNavigate } from '@tanstack/react-router';
import { useGetCompetition, useGetLeaderboard } from '../hooks/useQueries';
import { Loader2, Trophy } from 'lucide-react';
import { Event } from '../backend';
import { DEFAULT_EVENT, EVENT_LABELS } from '../types/domain';

export default function LeaderboardPage() {
  const { competitionId } = useParams({ from: '/competitions/$competitionId/leaderboard' });
  const search = useSearch({ from: '/competitions/$competitionId/leaderboard' }) as { event?: Event };
  const selectedEvent = search.event || DEFAULT_EVENT;
  const navigate = useNavigate();

  const { data: competition, isLoading: compLoading } = useGetCompetition(BigInt(competitionId));
  const { data: leaderboard = [], isLoading: leaderboardLoading } = useGetLeaderboard(
    BigInt(competitionId),
    selectedEvent
  );

  const handleNameClick = (userPrincipal: any) => {
    const principalStr = userPrincipal.toString();
    navigate({ to: '/profiles/$principal', params: { principal: principalStr } });
  };

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
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-chart-1 to-chart-2 rounded-xl flex items-center justify-center">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">{competition.name}</h1>
            <p className="text-muted-foreground mt-1">{EVENT_LABELS[selectedEvent]} Leaderboard</p>
          </div>
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border">
            <p className="text-muted-foreground">No results yet. Be the first to compete!</p>
          </div>
        ) : (
          <div className="bg-card rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Rank</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Competitor</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Best Time</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Attempts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {leaderboard.map((entry, index) => (
                    <tr key={entry.user.toString()} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {index === 0 && <Trophy className="w-5 h-5 text-chart-1" />}
                          <span className="font-semibold">{index + 1}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleNameClick(entry.user)}
                          className="text-left focus:outline-none"
                        >
                          <p className="font-medium text-chart-1 hover:underline">
                            {entry.userProfile?.displayName || 'Anonymous'}
                          </p>
                          {entry.userProfile?.country && (
                            <p className="text-sm text-muted-foreground">{entry.userProfile.country}</p>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-mono font-semibold text-chart-1">
                          {(Number(entry.bestTime) / 1000).toFixed(2)}s
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-center">
                          {entry.attempts.map((att, i) => (
                            <span key={i} className="font-mono text-sm">
                              {(Number(att.time) / 1000).toFixed(2)}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
