import { useNavigate } from '@tanstack/react-router';
import { Competition } from '../../backend';
import { Calendar, Users, Trophy } from 'lucide-react';
import { formatDate } from '../../lib/dateUtils';

interface CompetitionCardProps {
  competition: Competition;
}

export default function CompetitionCard({ competition }: CompetitionCardProps) {
  const navigate = useNavigate();

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

  return (
    <button
      onClick={() => navigate({ to: '/competition/$competitionId', params: { competitionId: competition.id.toString() } })}
      className="w-full bg-card border border-border rounded-xl p-6 hover:border-chart-1/50 hover:shadow-lg hover:shadow-chart-1/5 transition-all text-left group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-1 group-hover:text-chart-1 transition-colors">
            {competition.name}
          </h3>
          <p className="text-sm text-muted-foreground">Event: 3x3x3 Cube</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border ${
            statusColors[competition.status]
          }`}
        >
          {statusLabels[competition.status]}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>
            {formatDate(competition.startDate)} - {formatDate(competition.endDate)}
          </span>
        </div>
        {competition.participantLimit && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>Limit: {competition.participantLimit.toString()} participants</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Trophy className="w-4 h-4" />
          <span>5 solves • Ao5 format</span>
        </div>
      </div>
    </button>
  );
}
