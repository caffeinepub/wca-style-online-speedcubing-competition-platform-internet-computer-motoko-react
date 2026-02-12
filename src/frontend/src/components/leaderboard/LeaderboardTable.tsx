import { Trophy, Medal } from 'lucide-react';
import { formatTime } from '../../lib/timeUtils';
import { calculateAo5 } from '../../lib/ao5';
import type { ResultInput, PublicProfileInfo } from '../../backend';

interface LeaderboardTableProps {
  results: ResultInput[];
  publicProfiles: Map<string, PublicProfileInfo>;
}

export default function LeaderboardTable({ results, publicProfiles }: LeaderboardTableProps) {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-chart-4" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-muted-foreground" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-chart-5" />;
    return null;
  };

  const getDisplayName = (userPrincipal: any): string => {
    const userStr = userPrincipal.toString();
    const profile = publicProfiles.get(userStr);
    
    if (profile && profile.displayName && profile.displayName.trim()) {
      return profile.displayName.trim();
    }
    
    return 'Anonymous';
  };

  const entries = results.map((result, index) => {
    const attempts = result.attempts.map((a) => ({
      time: Number(a.time),
      penalty: Number(a.penalty),
    }));
    const ao5 = calculateAo5(attempts);

    return {
      rank: index + 1,
      displayName: getDisplayName(result.user),
      ao5,
      attempts,
    };
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-4 px-4 font-bold text-sm text-muted-foreground">Rank</th>
            <th className="text-left py-4 px-4 font-bold text-sm text-muted-foreground">Competitor</th>
            <th className="text-left py-4 px-4 font-bold text-sm text-muted-foreground">Ao5</th>
            <th className="text-left py-4 px-4 font-bold text-sm text-muted-foreground">Solve 1</th>
            <th className="text-left py-4 px-4 font-bold text-sm text-muted-foreground">Solve 2</th>
            <th className="text-left py-4 px-4 font-bold text-sm text-muted-foreground">Solve 3</th>
            <th className="text-left py-4 px-4 font-bold text-sm text-muted-foreground">Solve 4</th>
            <th className="text-left py-4 px-4 font-bold text-sm text-muted-foreground">Solve 5</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.rank} className="border-b border-border hover:bg-accent/50 transition-colors">
              <td className="py-4 px-4">
                <div className="flex items-center gap-2">
                  {getRankIcon(entry.rank)}
                  <span className="font-bold text-lg">{entry.rank}</span>
                </div>
              </td>
              <td className="py-4 px-4 font-medium">{entry.displayName}</td>
              <td className="py-4 px-4 font-bold text-chart-1">{formatTime(entry.ao5)}</td>
              {entry.attempts.map((attempt, idx) => (
                <td key={idx} className="py-4 px-4 text-muted-foreground">
                  {formatTime(attempt.time + attempt.penalty)}
                  {attempt.penalty > 0 && <span className="text-destructive ml-1">+{attempt.penalty / 1000}</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
