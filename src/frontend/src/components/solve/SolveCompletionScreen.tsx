import { useNavigate } from '@tanstack/react-router';
import { Trophy, BarChart3, Home } from 'lucide-react';
import { Event } from '../../backend';

interface SolveCompletionScreenProps {
  competitionId: string;
  event: Event;
}

export default function SolveCompletionScreen({ competitionId, event }: SolveCompletionScreenProps) {
  const navigate = useNavigate();

  const handleViewLeaderboard = () => {
    navigate({
      to: '/competition/$competitionId/leaderboard',
      params: { competitionId },
      search: { event },
    });
  };

  const handleBackToCompetition = () => {
    navigate({
      to: '/competition/$competitionId',
      params: { competitionId },
      search: { event },
    });
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-chart-1 to-chart-2 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-chart-1/20">
          <Trophy className="w-12 h-12 text-white" />
        </div>

        <h1 className="text-4xl font-bold mb-4">Congratulations!</h1>
        <p className="text-xl text-muted-foreground mb-12">
          You've completed all 5 solves. Your results have been submitted to the leaderboard.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleViewLeaderboard}
            className="px-8 py-4 bg-chart-1 hover:bg-chart-1/90 text-white font-bold text-lg rounded-xl transition-colors shadow-lg shadow-chart-1/20 flex items-center justify-center gap-3"
          >
            <BarChart3 className="w-5 h-5" />
            View Leaderboard
          </button>
          <button
            onClick={handleBackToCompetition}
            className="px-8 py-4 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold text-lg rounded-xl transition-colors flex items-center justify-center gap-3"
          >
            <Home className="w-5 h-5" />
            Back to Competition
          </button>
        </div>
      </div>
    </div>
  );
}
