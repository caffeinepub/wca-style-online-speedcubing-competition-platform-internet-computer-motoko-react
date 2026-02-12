import { useNavigate } from '@tanstack/react-router';
import type { CompetitionPublic } from '../../types/backend-extended';
import { formatDate } from '../../lib/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users } from 'lucide-react';

interface CompetitionCardProps {
  competition: CompetitionPublic;
}

export default function CompetitionCard({ competition }: CompetitionCardProps) {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
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

  const getStatusLabel = (status: string) => {
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

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() =>
        navigate({
          to: '/competitions/$competitionId',
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
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDate(competition.startDate)} - {formatDate(competition.endDate)}
            </span>
          </div>
          {competition.participantLimit && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Limit: {competition.participantLimit.toString()} participants</span>
            </div>
          )}
          <div className="mt-2">
            <span className="font-medium">{competition.events.length} events</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
