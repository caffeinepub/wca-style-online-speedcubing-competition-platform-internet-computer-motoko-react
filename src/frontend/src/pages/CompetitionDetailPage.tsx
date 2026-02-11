import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetCompetition, useStartCompetition, useGetMyCompetitionResult } from '../hooks/useQueries';
import { Calendar, Users, Trophy, Play, Loader2, BarChart3 } from 'lucide-react';
import { formatDate } from '../lib/dateUtils';
import RequireAuth from '../components/auth/RequireAuth';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

export default function CompetitionDetailPage() {
  const { competitionId } = useParams({ from: '/competition/$competitionId' });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: competition, isLoading } = useGetCompetition(BigInt(competitionId));
  const { data: myResult, isLoading: resultLoading } = useGetMyCompetitionResult(BigInt(competitionId));
  const startCompetition = useStartCompetition();

  const handleStart = async () => {
    try {
      await startCompetition.mutateAsync(BigInt(competitionId));
      navigate({ to: '/competition/$competitionId/solve', params: { competitionId } });
    } catch (error) {
      console.error('Failed to start competition:', error);
    }
  };

  const handleContinue = () => {
    navigate({ to: '/competition/$competitionId/solve', params: { competitionId } });
  };

  const handleViewLeaderboard = () => {
    navigate({ to: '/competition/$competitionId/leaderboard', params: { competitionId } });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-chart-1 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading competition...</p>
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

  const statusColors = {
    upcoming: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
    running: 'bg-chart-1/10 text-chart-1 border-chart-1/20',
    completed: 'bg-muted text-muted-foreground border-border',
  };

  const statusLabels = {
    upcoming: 'Upcoming',
    running: 'Live',
    completed: 'Completed',
  };

  const canStart = isAuthenticated && competition.status === 'running' && !myResult;
  const canContinue = isAuthenticated && myResult?.status === 'in_progress';
  const isCompleted = myResult?.status === 'completed';

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card border border-border rounded-xl p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{competition.name}</h1>
              <p className="text-muted-foreground">Event: 3x3x3 Cube</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium border ${statusColors[competition.status]}`}>
              {statusLabels[competition.status]}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{formatDate(competition.startDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">{formatDate(competition.endDate)}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {competition.participantLimit && (
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Participant Limit</p>
                    <p className="font-medium">{competition.participantLimit.toString()}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Format</p>
                  <p className="font-medium">Average of 5 (Ao5)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-background border border-border rounded-lg p-6 mb-8">
            <h3 className="font-bold mb-4">Competition Rules</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Complete 5 solves with official WCA scrambles</li>
              <li>• 15-second inspection before each solve</li>
              <li>• +2 penalty for 15-17 second inspection</li>
              <li>• DNF for inspection over 17 seconds</li>
              <li>• Final ranking based on Average of 5 (best and worst times dropped)</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {!isAuthenticated && competition.status === 'running' && (
              <RequireAuth message="You must be logged in to participate in competitions.">
                <div />
              </RequireAuth>
            )}
            
            {canStart && (
              <button
                onClick={handleStart}
                disabled={startCompetition.isPending || resultLoading}
                className="flex-1 px-8 py-4 bg-chart-1 hover:bg-chart-1/90 text-white font-bold text-lg rounded-xl transition-colors shadow-lg shadow-chart-1/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {startCompetition.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Start Competition
                  </>
                )}
              </button>
            )}

            {canContinue && (
              <button
                onClick={handleContinue}
                className="flex-1 px-8 py-4 bg-chart-2 hover:bg-chart-2/90 text-white font-bold text-lg rounded-xl transition-colors shadow-lg shadow-chart-2/20 flex items-center justify-center gap-3"
              >
                <Play className="w-5 h-5" />
                Continue Solving
              </button>
            )}

            {isCompleted && (
              <div className="flex-1 bg-chart-1/10 border border-chart-1/20 rounded-xl p-4 text-center">
                <p className="text-chart-1 font-medium">✓ Competition Completed</p>
              </div>
            )}

            <button
              onClick={handleViewLeaderboard}
              className="flex-1 px-8 py-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold text-lg rounded-xl transition-colors flex items-center justify-center gap-3"
            >
              <BarChart3 className="w-5 h-5" />
              View Leaderboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
