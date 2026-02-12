import { useNavigate } from '@tanstack/react-router';
import { useGetCompetitions } from '../hooks/useQueries';
import { Trophy, Loader2, BarChart3, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '../lib/dateUtils';
import { CompetitionStatus } from '../backend';

export default function LeaderboardsHubPage() {
  const navigate = useNavigate();
  const { data: competitions = [], isLoading } = useGetCompetitions();

  const getStatusBadgeVariant = (status: CompetitionStatus) => {
    switch (status) {
      case CompetitionStatus.running:
        return 'default';
      case CompetitionStatus.completed:
        return 'secondary';
      case CompetitionStatus.upcoming:
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: CompetitionStatus) => {
    switch (status) {
      case CompetitionStatus.running:
        return 'Running';
      case CompetitionStatus.completed:
        return 'Completed';
      case CompetitionStatus.upcoming:
        return 'Upcoming';
      default:
        return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-chart-1 mx-auto mb-4" />
              <p className="text-muted-foreground">Loading competitions...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-chart-1 to-chart-2 rounded-xl flex items-center justify-center">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Leaderboards</h1>
              <p className="text-muted-foreground mt-1">
                View competition results and rankings
              </p>
            </div>
          </div>

          {competitions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No competitions available yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {competitions.map((competition) => (
                <Card
                  key={competition.id.toString()}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() =>
                    navigate({
                      to: '/competitions/$competitionId/leaderboard',
                      params: { competitionId: competition.id.toString() },
                    })
                  }
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="text-xl line-clamp-2">
                        {competition.name}
                      </CardTitle>
                      <Badge variant={getStatusBadgeVariant(competition.status)}>
                        {getStatusLabel(competition.status)}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(competition.startDate)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{competition.events.length} event{competition.events.length !== 1 ? 's' : ''}</span>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate({
                            to: '/competitions/$competitionId/leaderboard',
                            params: { competitionId: competition.id.toString() },
                          });
                        }}
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Leaderboard
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
