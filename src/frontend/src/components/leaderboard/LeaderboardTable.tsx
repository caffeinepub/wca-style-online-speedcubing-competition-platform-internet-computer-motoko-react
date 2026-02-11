import { Trophy, Medal } from 'lucide-react';
import { formatTime } from '../../lib/timeUtils';

interface LeaderboardEntry {
  rank: number;
  displayName: string;
  ao5: number | 'DNF';
  attempts: Array<{ time: number; penalty: number }>;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
}

export default function LeaderboardTable({ entries }: LeaderboardTableProps) {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-chart-4" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-muted-foreground" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-chart-5" />;
    return null;
  };

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
            <tr key={entry.rank} className="border-b border-border/50 hover:bg-card/50 transition-colors">
              <td className="py-4 px-4">
                <div className="flex items-center gap-2">
                  {getRankIcon(entry.rank)}
                  <span className="font-bold">{entry.rank}</span>
                </div>
              </td>
              <td className="py-4 px-4 font-medium">{entry.displayName}</td>
              <td className="py-4 px-4">
                <span className={`font-bold ${entry.rank <= 3 ? 'text-chart-1' : ''}`}>
                  {entry.ao5 === 'DNF' ? 'DNF' : formatTime(entry.ao5)}
                </span>
              </td>
              {entry.attempts.map((attempt, idx) => (
                <td key={idx} className="py-4 px-4 text-sm text-muted-foreground">
                  {formatTime(attempt.time + attempt.penalty)}
                  {attempt.penalty === 2000 && <span className="text-chart-4 ml-1">+2</span>}
                  {attempt.penalty === 999999 && <span className="text-destructive ml-1">DNF</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
