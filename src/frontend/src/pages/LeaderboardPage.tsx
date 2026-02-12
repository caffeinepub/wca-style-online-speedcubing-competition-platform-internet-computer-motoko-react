import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetCompetition, useGetLeaderboard } from '../hooks/useQueries';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EVENT_LABELS } from '../types/domain';
import { Event } from '../backend';
import { Trophy, Medal } from 'lucide-react';
import { formatTime } from '../lib/timeUtils';
import { calculateAo5 } from '../lib/ao5';

export default function LeaderboardPage() {
  const { competitionId } = useParams({ from: '/competitions/$competitionId/leaderboard' });
  const navigate = useNavigate();
  const compId = BigInt(competitionId);

  const { data: competition, isLoading: competitionLoading } = useGetCompetition(compId);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Set default event when competition loads
  if (competition && !selectedEvent && competition.events.length > 0) {
    setSelectedEvent(competition.events[0]);
  }

  const { data: leaderboard, isLoading: leaderboardLoading } = useGetLeaderboard(
    compId,
    selectedEvent || Event.threeByThree
  );

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-chart-4" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-muted-foreground" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-chart-5" />;
    return null;
  };

  const getDisplayName = (entry: any): string => {
    if (entry.userProfile && entry.userProfile.displayName && entry.userProfile.displayName.trim()) {
      return entry.userProfile.displayName.trim();
    }
    return 'Anonymous';
  };

  const handleNameClick = (userPrincipal: any) => {
    const principalStr = userPrincipal.toString();
    navigate({ to: '/profiles/$principal', params: { principal: principalStr } });
  };

  if (competitionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Competition Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate({ to: '/competitions' })}>
              Back to Competitions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const entries = leaderboard?.map((entry, index) => {
    const attempts = entry.attempts.map((a) => ({
      time: Number(a.time),
      penalty: Number(a.penalty),
    }));
    const ao5 = calculateAo5(attempts);

    return {
      rank: index + 1,
      displayName: getDisplayName(entry),
      userPrincipal: entry.user,
      ao5,
      attempts,
    };
  }) || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: '/competitions/$competitionId', params: { competitionId } })}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Competition
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{competition.name}</h1>
          <p className="text-muted-foreground">Competition Leaderboards</p>
        </div>

        {competition.events.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No events available for this competition</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-6">
              <label className="text-sm font-medium mb-2 block">Select Event</label>
              <Select
                value={selectedEvent || undefined}
                onValueChange={(value) => setSelectedEvent(value as Event)}
              >
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="Choose an event" />
                </SelectTrigger>
                <SelectContent>
                  {competition.events.map((event) => (
                    <SelectItem key={event} value={event}>
                      {EVENT_LABELS[event]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {leaderboardLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !leaderboard || leaderboard.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No completed results yet for {selectedEvent ? EVENT_LABELS[selectedEvent] : 'this event'}
                  </p>
                </CardContent>
              </Card>
            ) : (
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
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleNameClick(entry.userPrincipal)}
                            className="font-medium text-chart-1 hover:underline focus:outline-none focus:underline"
                          >
                            {entry.displayName}
                          </button>
                        </td>
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
            )}
          </>
        )}
      </div>
    </div>
  );
}
