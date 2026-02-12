import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetPublicProfileInfo, useGetPublicResultsForUser } from '../hooks/useQueries';
import { Loader2, ArrowLeft, Trophy, Target, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EVENT_LABELS } from '../types/domain';
import { calculateAo5 } from '../lib/ao5';
import type { Event } from '../backend';

export default function PublicProfilePage() {
  const { principal } = useParams({ from: '/profiles/$principal' });
  const navigate = useNavigate();

  const { data: profileInfo, isLoading: profileLoading } = useGetPublicProfileInfo(principal);
  const { data: resultsData, isLoading: resultsLoading } = useGetPublicResultsForUser(principal);

  const isLoading = profileLoading || resultsLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-chart-1 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profileInfo) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
          <p className="text-muted-foreground">This competitor profile doesn't exist.</p>
          <Button onClick={() => navigate({ to: '/' })} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const results = resultsData?.results || [];
  
  // Calculate stats
  const eventsPlayed = new Set(results.map(r => r.event)).size;
  // Since we don't have competitionId in results, we can't accurately count competitions
  // We'll just show the number of completed results as a proxy
  const completedResults = results.filter(r => r.status === 'completed').length;
  const totalSolves = results.reduce((sum, r) => sum + r.attempts.length, 0);

  // Group results by event only (since we don't have competitionId)
  const resultsByEvent = results.reduce((acc, result) => {
    if (!acc[result.event]) {
      acc[result.event] = [];
    }
    acc[result.event].push(result);
    return acc;
  }, {} as Record<Event, typeof results>);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: '/leaderboards' })}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Leaderboards
        </Button>

        {/* Profile Header */}
        <div className="bg-gradient-to-br from-chart-1 to-chart-2 rounded-xl p-8 mb-8 text-white">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
              {profileInfo.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-4xl font-bold">{profileInfo.displayName}</h1>
              {profileInfo.country && (
                <p className="text-white/80 mt-1">{profileInfo.country}</p>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-5 h-5" />
                <span className="text-sm font-medium">Events Played</span>
              </div>
              <p className="text-3xl font-bold">{eventsPlayed}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-5 h-5" />
                <span className="text-sm font-medium">Completed Results</span>
              </div>
              <p className="text-3xl font-bold">{completedResults}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-5 h-5" />
                <span className="text-sm font-medium">Total Solves</span>
              </div>
              <p className="text-3xl font-bold">{totalSolves}</p>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Personal Records</h2>

          {results.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg border">
              <p className="text-muted-foreground">No competition results yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(resultsByEvent).map(([event, eventResults]) => {
                // Calculate best Ao5 and single across all results for this event
                let bestAo5: number | 'DNF' = 'DNF';
                let bestSingle = Infinity;

                eventResults.forEach(result => {
                  const attempts = result.attempts.map(a => ({
                    time: Number(a.time),
                    penalty: Number(a.penalty),
                  }));
                  
                  const ao5 = calculateAo5(attempts);
                  if (ao5 !== 'DNF') {
                    if (bestAo5 === 'DNF' || ao5 < bestAo5) {
                      bestAo5 = ao5;
                    }
                  }

                  const single = Math.min(...attempts.map(a => a.time + a.penalty));
                  if (single < bestSingle) {
                    bestSingle = single;
                  }
                });

                return (
                  <div key={event} className="bg-card rounded-lg border overflow-hidden">
                    <div className="bg-muted/50 px-6 py-4 border-b">
                      <h3 className="font-semibold text-lg">
                        {EVENT_LABELS[event as Event]}
                      </h3>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-1">
                            {eventResults.length} result{eventResults.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex gap-8 items-center">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground mb-1">Best Ao5</p>
                            <p className="font-mono font-semibold text-chart-1 text-lg">
                              {bestAo5 === 'DNF' ? 'DNF' : `${(bestAo5 / 1000).toFixed(2)}s`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground mb-1">Best Single</p>
                            <p className="font-mono font-semibold text-lg">
                              {bestSingle === Infinity ? '-' : `${(bestSingle / 1000).toFixed(2)}s`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
