import React, { useState, useEffect } from 'react';
import { useParams } from '@tanstack/react-router';
import { useGetCompetition, useGetLeaderboard } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Event } from '../backend';
import { EVENT_LABELS } from '../types/domain';
import { normalizeError } from '../api/errors';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle, Loader2, Trophy } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

export default function LeaderboardPage() {
  const { competitionId: competitionIdParam } = useParams({ from: '/competitions/$competitionId/leaderboard' });
  const competitionId = BigInt(competitionIdParam);
  const navigate = useNavigate();

  const { data: competition, isLoading: competitionLoading, isError: competitionError, error: competitionErrorObj } = useGetCompetition(competitionId);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const {
    data: leaderboard,
    isLoading: leaderboardLoading,
    isError: leaderboardError,
    error: leaderboardErrorObj,
  } = useGetLeaderboard(competitionId, selectedEvent || Event.threeByThree);

  // Set default event when competition loads
  useEffect(() => {
    if (competition && competition.events.length > 0 && !selectedEvent) {
      setSelectedEvent(competition.events[0]);
    }
  }, [competition, selectedEvent]);

  const handleCompetitorClick = (principalString: string) => {
    navigate({ to: '/profiles/$principal', params: { principal: principalString } });
  };

  if (competitionLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (competitionError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {normalizeError(competitionErrorObj)}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Competition not found
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            {competition.name} - Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Event</label>
            <Select
              value={selectedEvent || ''}
              onValueChange={(value) => setSelectedEvent(value as Event)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an event" />
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

          {leaderboardLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {leaderboardError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {normalizeError(leaderboardErrorObj)}
              </AlertDescription>
            </Alert>
          )}

          {!leaderboardLoading && !leaderboardError && leaderboard && leaderboard.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No results available for this event yet
            </div>
          )}

          {!leaderboardLoading && !leaderboardError && leaderboard && leaderboard.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Competitor</TableHead>
                    <TableHead>Ao5</TableHead>
                    <TableHead>Best</TableHead>
                    <TableHead>Attempt 1</TableHead>
                    <TableHead>Attempt 2</TableHead>
                    <TableHead>Attempt 3</TableHead>
                    <TableHead>Attempt 4</TableHead>
                    <TableHead>Attempt 5</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((entry, index) => {
                    const displayName = entry.userProfile?.displayName || 'Anonymous';
                    return (
                      <TableRow key={entry.user.toString()}>
                        <TableCell className="font-bold">
                          {index === 0 && <Trophy className="inline h-4 w-4 text-yellow-500 mr-1" />}
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleCompetitorClick(entry.user.toString())}
                            className="text-primary hover:underline"
                          >
                            {displayName}
                          </button>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {entry.ao5 ? `${(Number(entry.ao5) / 1000).toFixed(2)}s` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {entry.bestTime ? `${(Number(entry.bestTime) / 1000).toFixed(2)}s` : 'N/A'}
                        </TableCell>
                        {entry.attempts.map((attempt, i) => (
                          <TableCell key={i}>
                            {attempt.time ? `${(Number(attempt.time) / 1000).toFixed(2)}s` : 'DNF'}
                            {attempt.penalty > 0 && (
                              <Badge variant="secondary" className="ml-1">
                                +{Number(attempt.penalty) / 1000}s
                              </Badge>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
