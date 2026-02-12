import { useNavigate } from '@tanstack/react-router';
import RequireAuth from '../components/auth/RequireAuth';
import { useGetCompetitions } from '../hooks/useQueries';
import { formatDate } from '../lib/dateUtils';
import { Loader2, Trophy, Calendar, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CompetitionStatus } from '../types/backend-extended';
import { Badge } from '@/components/ui/badge';

export default function LeaderboardsHubPage() {
  const navigate = useNavigate();
  const { data: competitions, isLoading } = useGetCompetitions();

  const getStatusColor = (status: CompetitionStatus) => {
    switch (status) {
      case 'running':
        return 'bg-green-500';
      case 'upcoming':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: CompetitionStatus) => {
    switch (status) {
      case 'running':
        return 'Running';
      case 'upcoming':
        return 'Upcoming';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <RequireAuth>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-8">
            <Trophy className="h-10 w-10 text-primary" />
            <h1 className="text-4xl font-bold">Competition Leaderboards</h1>
          </div>

          <p className="text-muted-foreground mb-8">
            View leaderboards and results for all competitions
          </p>

          {!competitions || competitions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No competitions available yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {competitions.map((competition) => (
                <Card
                  key={competition.id.toString()}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() =>
                    navigate({
                      to: '/competitions/$competitionId/leaderboard',
                      params: { competitionId: competition.id.toString() },
                    })
                  }
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-xl">{competition.name}</CardTitle>
                      <Badge className={getStatusColor(competition.status)}>
                        {getStatusLabel(competition.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDate(competition.startDate)} - {formatDate(competition.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Target className="h-4 w-4" />
                        <span>{competition.events.length} events</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </RequireAuth>
  );
}
